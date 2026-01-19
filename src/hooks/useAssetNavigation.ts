import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();

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

  // Get current folder ID from breadcrumb
  const currentFolderId = breadcrumb.length > 0 
    ? breadcrumb[breadcrumb.length - 1].id 
    : undefined;

  /**
   * Parse URL path to extract folder hierarchy and selected file
   */
  const parseUrlPath = useCallback(async () => {
    const path = location.pathname.replace('/asset', '').replace(/^\/+|\/+$/g, '');
    console.log('Parsing URL path:', location.pathname, '-> cleaned path:', path);
    
    if (!path) return { folderPath: [], selectedFileId: null };
    
    const segments = path.split('/').filter(segment => segment);
    console.log('URL segments:', segments);
    
    if (segments.length === 0) return { folderPath: [], selectedFileId: null };
    
    // Single segment case: assume it's a document in root
    if (segments.length === 1) {
      const possibleFileId = segments[0];
      console.log('🔍 Single segment detected, assuming document in root:', possibleFileId);
      return { folderPath: [], selectedFileId: possibleFileId };
    }
    
    // Multi-segment case
    const possibleFileId = segments[segments.length - 1];
    const parentFolderPath = segments.slice(0, -1);
    
    console.log('Checking if last segment is file:', possibleFileId);
    console.log('Parent folder path:', parentFolderPath);
    
    // Approach 1: Check if last segment is a file by loading parent folder
    try {
      const parentFolderId = parentFolderPath.length > 0 
        ? parentFolderPath[parentFolderPath.length - 1] 
        : undefined;
      console.log('Checking parent folder ID for file detection:', parentFolderId);
      
      const parentContent = await getLibraryContent(selectedOrganizationId!, parentFolderId);
      const items = parentContent?.content || [];
      console.log('Parent folder items count:', items.length);
      
      const foundFile = items.find(
        (item: LibraryItem) => item.id === possibleFileId && item.type === 'document'
      );
      
      if (foundFile) {
        console.log('✓ Last segment is a file:', foundFile.name);
        return { folderPath: parentFolderPath, selectedFileId: possibleFileId };
      }
    } catch (error) {
      console.log('Parent folder check failed, will try folder approach:', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
    
    // Approach 2: Try to access the full path as folders
    try {
      console.log('Attempting to access as folder path:', segments);
      const lastFolderId = segments[segments.length - 1];
      
      const folderContent = await getLibraryContent(selectedOrganizationId!, lastFolderId);
      
      if (folderContent?.content !== undefined) {
        console.log('✓ Last segment is accessible as folder');
        return { folderPath: segments, selectedFileId: null };
      }
    } catch (error) {
      console.log('Folder access failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Fallback: treat as file
    console.log('Using fallback approach - treating last segment as file');
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
    console.log('Loading folder hierarchy for path:', folderIds);
    const hierarchy: BreadcrumbItem[] = [];
    let currentFolderId: string | undefined = undefined;
    
    for (let i = 0; i < folderIds.length; i++) {
      const targetFolderId = folderIds[i];
      console.log(`Loading folder ${i + 1}/${folderIds.length}: ${targetFolderId} in parent: ${currentFolderId || 'root'}`);
      
      try {
        const data = await getLibraryContent(selectedOrganizationId!, currentFolderId);
        console.log('Parent folder content:', data?.content?.length, 'items');
        
        if (!data?.content) {
          console.error('No content returned from API');
          break;
        }
        
        const folders = data.content.filter((item: LibraryItem) => item.type === 'folder');
        console.log('Available folders:', folders.map((f: LibraryItem) => ({ id: f.id, name: f.name })));
        
        const targetFolder = folders.find((folder: LibraryItem) => folder.id === targetFolderId);
        
        if (targetFolder) {
          console.log(`✓ Found folder: ${targetFolder.name} (${targetFolder.id})`);
          hierarchy.push({ id: targetFolder.id, name: targetFolder.name });
          currentFolderId = targetFolder.id;
        } else {
          console.warn(`✗ Folder ${targetFolderId} not found. Stopping hierarchy load.`);
          console.warn('Available folder IDs:', folders.map((f: LibraryItem) => f.id));
          
          if (hierarchy.length > 0) {
            console.log('Returning partial hierarchy:', hierarchy);
            return hierarchy;
          }
          break;
        }
      } catch (error) {
        console.error(`✗ Error loading folder hierarchy at ${targetFolderId}:`, error);
        if (hierarchy.length > 0) {
          console.log('Returning partial hierarchy due to error:', hierarchy);
          return hierarchy;
        }
        break;
      }
    }
    
    console.log('Final complete hierarchy:', hierarchy);
    return hierarchy;
  }, [selectedOrganizationId]);

  /**
   * Initialize from URL on mount and when URL changes
   */
  useEffect(() => {
    if (!selectedOrganizationId || !organizationToken) return;
    
    // Skip if this URL has already been processed
    if (lastProcessedUrlRef.current === location.pathname) {
      console.log('URL already processed, skipping:', location.pathname);
      return;
    }
    
    const initializeFromUrl = async () => {
      try {
        console.log('Initializing from URL:', location.pathname);
        setIsLoadingDocument(true);
        
        // Mark this URL as processed
        lastProcessedUrlRef.current = location.pathname;
        
        // Check if we're coming from FileTree navigation with full context
        const navState = location.state as LibraryNavigationState | undefined;
        if (navState?.fromFileTree && navState.selectedDocumentId) {
          console.log('✅ Navigation from FileTree detected, using provided context');
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
        console.log('Parsed URL result:', { folderPath, selectedFileId });
        
        if (folderPath.length > 0) {
          try {
            console.log('Loading folder hierarchy...');
            const hierarchy = await loadFolderHierarchy(folderPath);
            console.log('Loaded hierarchy:', hierarchy);
            
            if (hierarchy.length > 0) {
              setBreadcrumb(hierarchy);
              console.log('Breadcrumb set to:', hierarchy);
              
              // Update URL if we only got a partial hierarchy
              if (hierarchy.length < folderPath.length) {
                console.log('Partial hierarchy loaded, updating URL to match reality');
                const actualUrl = buildUrlPath(hierarchy, selectedFileId || undefined);
                navigate(actualUrl, { replace: true });
                
                setTimeout(async () => {
                  const { toast } = await import("sonner");
                  toast.warning(`Some folders in the URL path could not be found. Navigated to the deepest accessible folder.`);
                }, 100);
              }
            } else {
              console.warn('No valid hierarchy found, redirecting to root');
              navigate('/asset', { replace: true });
              return;
            }
          } catch (error) {
            console.error('Error loading folder hierarchy from URL:', error);
            navigate('/asset', { replace: true });
            return;
          }
        } else {
          setBreadcrumb([]);
        }
        
        if (selectedFileId) {
          console.log('Loading selected file details...');
          setSelectedExecutionId(null);
          setSelectedFile({
            id: selectedFileId,
            name: `Document ${selectedFileId.substring(0, 8)}...`,
            type: 'document'
          });
        } else {
          setSelectedFile(null);
        }
        
        console.log('URL initialization completed');
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
      
      if (location.pathname !== '/asset') {
        initializeFromUrl();
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
      initializeFromUrl();
    }
  }, [selectedOrganizationId, organizationToken, location.pathname, location.state, parseUrlPath, loadFolderHierarchy, buildUrlPath, navigate]);

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
    
    const newUrl = buildUrlPath(breadcrumb, selectedFile?.id);
    
    // Don't update URL if navigation came from FileTree
    const navigationState = location.state as any;
    if (navigationState?.fromFileTree) {
      console.log('⏭️ [ASSETS] Skipping URL update - navigation from FileTree');
      return;
    }
    
    if (location.pathname !== newUrl && !isUpdatingUrl) {
      console.log('🔄 [ASSETS] Updating URL to reflect current state:', newUrl);
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
      
      console.log('Organization actually changed, resetting state');
      setBreadcrumb([]);
      setSelectedFile(null);
      setSelectedExecutionId(null);
      hasRestoredRef.current = false;
      lastProcessedUrlRef.current = '';
      
      sessionStorage.removeItem('library-breadcrumb');
      sessionStorage.removeItem('library-selectedFile');
      
      if (location.pathname !== '/asset') {
        console.log('Organization changed, navigating to assets root');
        setIsUpdatingUrl(true);
        navigate('/asset', { replace: true });
        setTimeout(() => setIsUpdatingUrl(false), 200);
      }
    }
    
    prevOrganizationIdRef.current = selectedOrganizationId;
  }, [selectedOrganizationId, navigate, location.pathname]);

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

  /**
   * Reset execution ID when document changes
   */
  useEffect(() => {
    if (selectedFile?.type === 'document') {
      setSelectedExecutionId(null);
    }
  }, [selectedFile?.id]);

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
