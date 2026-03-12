import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useOrgNavigate, stripOrgPrefix } from "@/hooks/useOrgRouter";
import { getLibraryContent } from "@/services/folders";
import type { BreadcrumbItem, LibraryItem, LibraryNavigationState } from "@/components/assets";

interface UseAssetNavigationProps {
  selectedOrganizationId: string | null;
  organizationToken: string | null;
}

interface UseAssetNavigationReturn {
  breadcrumb: BreadcrumbItem[];
  selectedFile: LibraryItem | null;
  selectedExecutionId: string | null;
  isLoadingDocument: boolean;
  isUpdatingUrl: boolean;
  setBreadcrumb: React.Dispatch<React.SetStateAction<BreadcrumbItem[]>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<LibraryItem | null>>;
  setSelectedExecutionId: React.Dispatch<React.SetStateAction<string | null>>;
  currentFolderId: string | undefined;
}

/**
 * Hook to manage asset navigation, URL parsing, and state synchronization
 */
export function useAssetNavigation({ 
  selectedOrganizationId, 
  organizationToken 
}: UseAssetNavigationProps): UseAssetNavigationReturn {
  const navigate = useOrgNavigate();
  const location = useLocation();
  const { orgId: urlOrgId } = useParams<{ orgId: string }>();

  // State management
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<LibraryItem | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);

  // Refs for tracking state
  const hasRestoredRef = useRef(false);
  const lastProcessedUrlRef = useRef<string>('');
  const prevOrganizationIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);

  // Get current folder ID from breadcrumb
  const currentFolderId = breadcrumb.length > 0 
    ? breadcrumb[breadcrumb.length - 1].id 
    : undefined;

  /**
   * Parse URL path to extract folder hierarchy and selected file
   */
  const parseUrlPath = useCallback(async () => {
    const strippedPathname = stripOrgPrefix(location.pathname);
    const path = strippedPathname.replace('/asset', '').replace(/^\/+|\/+$/g, '');
    
    if (!path) return { folderPath: [], selectedFileId: null };
    
    const segments = path.split('/').filter(segment => segment);
    
    if (segments.length === 0) return { folderPath: [], selectedFileId: null };
    
    // Single segment case: assume it's a document in root
    if (segments.length === 1) {
      return { folderPath: [], selectedFileId: segments[0] };
    }
    
    // Multi-segment case
    const possibleFileId = segments[segments.length - 1];
    const parentFolderPath = segments.slice(0, -1);
    
    // Approach 1: Check if last segment is a file by loading parent folder
    try {
      const parentFolderId = parentFolderPath.length > 0 
        ? parentFolderPath[parentFolderPath.length - 1] 
        : undefined;
      
      const parentContent = await getLibraryContent(selectedOrganizationId!, parentFolderId);
      const items = parentContent?.content || [];
      
      const foundFile = items.find(
        (item: LibraryItem) => item.id === possibleFileId && item.type === 'document'
      );
      
      if (foundFile) {
        return { folderPath: parentFolderPath, selectedFileId: possibleFileId };
      }
    } catch {
      // Will try folder approach below
    }
    
    // Approach 2: Try to access the full path as folders
    try {
      const lastFolderId = segments[segments.length - 1];
      const folderContent = await getLibraryContent(selectedOrganizationId!, lastFolderId);
      
      if (folderContent?.content !== undefined) {
        return { folderPath: segments, selectedFileId: null };
      }
    } catch {
      // Fallback below
    }
    
    // Fallback: treat as file
    return { folderPath: parentFolderPath, selectedFileId: possibleFileId };
  }, [location.pathname, selectedOrganizationId]);

  /**
   * Build URL path from breadcrumb and selected file
   */
  const buildUrlPath = useCallback((breadcrumb: BreadcrumbItem[], selectedFileId?: string) => {
    let path = '/asset';
    
    if (breadcrumb.length > 0) {
      const folderPath = breadcrumb.map(item => encodeURIComponent(item.id)).join('/');
      path += '/' + folderPath;
    }
    
    if (selectedFileId) {
      path += '/' + encodeURIComponent(selectedFileId);
    }
    
    return path;
  }, []);

  /**
   * Load folder hierarchy by reconstructing the path
   */
  const loadFolderHierarchy = useCallback(async (folderIds: string[]): Promise<BreadcrumbItem[]> => {
    const hierarchy: BreadcrumbItem[] = [];
    let currentFolderId: string | undefined = undefined;
    
    for (let i = 0; i < folderIds.length; i++) {
      const targetFolderId = folderIds[i];
      
      try {
        const data = await getLibraryContent(selectedOrganizationId!, currentFolderId);
        
        if (!data?.content) {
          break;
        }
        
        const folders = data.content.filter((item: LibraryItem) => item.type === 'folder');
        const targetFolder = folders.find((folder: LibraryItem) => folder.id === targetFolderId);
        
        if (targetFolder) {
          hierarchy.push({ id: targetFolder.id, name: targetFolder.name });
          currentFolderId = targetFolder.id;
        } else {
          if (hierarchy.length > 0) {
            return hierarchy;
          }
          break;
        }
      } catch (error) {
        console.error(`Error loading folder hierarchy at ${targetFolderId}:`, error);
        if (hierarchy.length > 0) {
          return hierarchy;
        }
        break;
      }
    }
    
    return hierarchy;
  }, [selectedOrganizationId]);

  /**
   * Initialize from URL on mount and when URL changes
   */
  useEffect(() => {
    if (!selectedOrganizationId || !organizationToken) return;
    
    // If the URL's orgId doesn't match the current context org, an org switch
    // is in progress — skip init until the switch completes and context catches up.
    if (urlOrgId && urlOrgId !== '_' && urlOrgId !== selectedOrganizationId) {
      return;
    }
    
    // Skip if this URL has already been processed (compare without org prefix)
    if (lastProcessedUrlRef.current === stripOrgPrefix(location.pathname)) {
      return;
    }
    
    const initializeFromUrl = async () => {
      try {
        setIsLoadingDocument(true);
        
        // Mark this URL as processed (store without org prefix)
        lastProcessedUrlRef.current = stripOrgPrefix(location.pathname);
        
        // Check if we're coming from FileTree navigation with full context
        const navState = location.state as LibraryNavigationState | undefined;
        if (navState?.fromFileTree && navState.selectedDocumentId) {
          setSelectedExecutionId(null);
          setSelectedFile({
            id: navState.selectedDocumentId,
            name: navState.selectedDocumentName || 'Document',
            type: 'document',
            document_type: navState.documentType,
            access_levels: navState.accessLevels,
          });
          setBreadcrumb([]);
          setIsLoadingDocument(false);
          return;
        }
        
        const { folderPath, selectedFileId } = await parseUrlPath();
        
        if (folderPath.length > 0) {
          try {
            const hierarchy = await loadFolderHierarchy(folderPath);
            
            if (hierarchy.length > 0) {
              setBreadcrumb(hierarchy);
              
              // Update URL if we only got a partial hierarchy
              if (hierarchy.length < folderPath.length) {
                const actualUrl = buildUrlPath(hierarchy, selectedFileId || undefined);
                navigate(actualUrl, { replace: true });
                
                setTimeout(async () => {
                  const { toast } = await import("sonner");
                  toast.warning(`Some folders in the URL path could not be found. Navigated to the deepest accessible folder.`);
                }, 100);
              }
            } else {
              navigate('/asset', { replace: true });
              return;
            }
          } catch {
            navigate('/asset', { replace: true });
            return;
          }
        } else {
          setBreadcrumb([]);
        }
        
        if (selectedFileId) {
          setSelectedExecutionId(null);
          setSelectedFile({
            id: selectedFileId,
            name: `Document ${selectedFileId.substring(0, 8)}...`,
            type: 'document'
          });
        } else {
          setSelectedFile(null);
        }
      } catch (error) {
        console.error('Error initializing from URL:', error);
        navigate('/asset', { replace: true });
      } finally {
        setIsLoadingDocument(false);
      }
    };
    
    // Check if this is first load or URL change
    if (!hasRestoredRef.current) {
      const savedBreadcrumb = sessionStorage.getItem('library-breadcrumb');
      const savedSelectedFile = sessionStorage.getItem('library-selectedFile');
      
      if (stripOrgPrefix(location.pathname) !== '/asset') {
        isInitializingRef.current = true;
        initializeFromUrl().finally(() => { isInitializingRef.current = false; });
      } else if (savedBreadcrumb) {
        try {
          const parsed = JSON.parse(savedBreadcrumb);
          if (Array.isArray(parsed) && parsed.length > 0) setBreadcrumb(parsed);
        } catch {}
        
        if (savedSelectedFile) {
          try {
            const parsedFile = JSON.parse(savedSelectedFile);
            if (parsedFile?.id) setSelectedFile(parsedFile);
          } catch {}
        }
      }
      
      hasRestoredRef.current = true;
    } else {
      isInitializingRef.current = true;
      initializeFromUrl().finally(() => { isInitializingRef.current = false; });
    }
  }, [selectedOrganizationId, organizationToken, urlOrgId, location.pathname, location.state, parseUrlPath, loadFolderHierarchy, buildUrlPath, navigate]);

  /**
   * Sync sessionStorage when breadcrumb or selectedFile changes
   */
  useEffect(() => {
    if (hasRestoredRef.current) {
      sessionStorage.setItem('library-breadcrumb', JSON.stringify(breadcrumb));
      
      if (selectedFile) {
        sessionStorage.setItem('library-selectedFile', JSON.stringify(selectedFile));
      } else {
        sessionStorage.removeItem('library-selectedFile');
      }
    }
  }, [breadcrumb, selectedFile]);

  /**
   * Update URL when selected file or breadcrumb changes
   */
  useEffect(() => {
    if (!hasRestoredRef.current || !selectedOrganizationId || !organizationToken) return;
    
    // Don't rewrite the URL while async initialization is in progress —
    // state (breadcrumb/selectedFile) hasn't settled yet.
    if (isInitializingRef.current) return;
    
    const newUrl = buildUrlPath(breadcrumb, selectedFile?.id);
    
    // Don't update URL if navigation came from FileTree
    const navigationState = location.state as any;
    if (navigationState?.fromFileTree) {
      return;
    }
    
    if (stripOrgPrefix(location.pathname) !== newUrl && !isUpdatingUrl) {
      setIsUpdatingUrl(true);
      
      lastProcessedUrlRef.current = newUrl;
      
      setTimeout(() => {
        navigate(newUrl, { replace: true });
        setTimeout(() => {
          setIsUpdatingUrl(false);
        }, 100);
      }, 0);
    }
  }, [breadcrumb, selectedFile, buildUrlPath, navigate, location.pathname, selectedOrganizationId, organizationToken, isUpdatingUrl, location.state]);

  /**
   * Reset state when organization changes
   */
  useEffect(() => {
    if (prevOrganizationIdRef.current !== null && 
        prevOrganizationIdRef.current !== selectedOrganizationId) {
      
      setBreadcrumb([]);
      setSelectedFile(null);
      setSelectedExecutionId(null);
      hasRestoredRef.current = false;
      lastProcessedUrlRef.current = '';
      
      sessionStorage.removeItem('library-breadcrumb');
      sessionStorage.removeItem('library-selectedFile');
      
      // Check if the URL orgId already matches the new org — if so, the switch
      // was driven by a shared URL and we should re-initialize from the URL
      // instead of redirecting to the asset root.
      const urlDroveChange = urlOrgId === selectedOrganizationId;
      
      if (!urlDroveChange && stripOrgPrefix(location.pathname) !== '/asset') {
        setIsUpdatingUrl(true);
        navigate('/asset', { replace: true });
        setTimeout(() => setIsUpdatingUrl(false), 200);
      }
      // else: shared URL-driven switch — the "Initialize from URL" effect will
      // re-run because hasRestoredRef and lastProcessedUrlRef were reset above.
    }
    
    prevOrganizationIdRef.current = selectedOrganizationId;
  }, [selectedOrganizationId, navigate, location.pathname, urlOrgId]);

  /**
   * Handle navigation state to restore selected document and breadcrumb
   */
  useEffect(() => {
    const navigationState = location.state as LibraryNavigationState | undefined;

    if (navigationState?.selectedDocumentId && navigationState?.selectedDocumentName) {
      setSelectedExecutionId(null);
      setSelectedFile({
        id: navigationState.selectedDocumentId,
        name: navigationState.selectedDocumentName,
        type: navigationState.selectedDocumentType || "document"
      });
      
      if (navigationState?.breadcrumb && navigationState.breadcrumb.length > 0) {
        setBreadcrumb(navigationState.breadcrumb);
      } else if (navigationState?.restoreBreadcrumb) {
        const savedBreadcrumb = sessionStorage.getItem('library-breadcrumb');
        if (savedBreadcrumb) {
          try {
            const parsedBreadcrumb = JSON.parse(savedBreadcrumb);
            setBreadcrumb(parsedBreadcrumb);
          } catch (error) {
            console.error('Error parsing saved breadcrumb:', error);
          }
        }
      }
      
      navigate(location.pathname, { replace: true });
    }
    
    if (navigationState?.fromLibrary) {
      const savedBreadcrumb = sessionStorage.getItem('library-breadcrumb');
      const savedSelectedFile = sessionStorage.getItem('library-selectedFile');
      
      if (savedBreadcrumb) {
        try {
          const parsedBreadcrumb = JSON.parse(savedBreadcrumb);
          setBreadcrumb(parsedBreadcrumb);
        } catch (error) {
          console.error('Error parsing saved breadcrumb:', error);
        }
      }
      
      if (savedSelectedFile) {
        try {
          const parsedSelectedFile = JSON.parse(savedSelectedFile);
          setSelectedExecutionId(null);
          setSelectedFile(parsedSelectedFile);
        } catch (error) {
          console.error('Error parsing saved selected file:', error);
        }
      }
      
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  return {
    breadcrumb,
    selectedFile,
    selectedExecutionId,
    isLoadingDocument,
    isUpdatingUrl,
    setBreadcrumb,
    setSelectedFile,
    setSelectedExecutionId,
    currentFolderId,
  };
}
