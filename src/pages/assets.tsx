import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Folder as FolderIcon, FileText } from "lucide-react"; 
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLibraryContent } from "@/services/folders";
import { AssetContent } from "@/components/assets";
import type { LibraryItem, BreadcrumbItem, LibraryNavigationState } from "@/components/assets";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";

import { useOrganization } from "@/contexts/organization-context";
import { Button } from "@/components/ui/button";
import { ExpandedFoldersProvider } from "@/hooks/use-expanded-folders";

function AssetsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Parse URL path to get folder path and selected file
  const parseUrlPath = async () => {
    const path = location.pathname.replace('/asset', '').replace(/^\/+|\/+$/g, '');
    console.log('Parsing URL path:', location.pathname, '-> cleaned path:', path);
    
    if (!path) return { folderPath: [], selectedFileId: null };
    
    const segments = path.split('/').filter(segment => segment);
    console.log('URL segments:', segments);
    
    if (segments.length === 0) return { folderPath: [], selectedFileId: null };
    
    // Special case: if we have only one segment, try to find document globally first
    if (segments.length === 1) {
      const possibleFileId = segments[0];
      console.log('🔍 Single segment detected, trying global document search:', possibleFileId);
      
      // Try to find the document in root first
      try {
        const rootContent = await getLibraryContent(selectedOrganizationId!, undefined);
        const rootItems = rootContent?.content || [];
        const foundInRoot = rootItems.find((item: LibraryItem) => item.id === possibleFileId && item.type === 'document');
        
        if (foundInRoot) {
          console.log('✅ Found document in root:', foundInRoot.name);
          return { 
            folderPath: [], 
            selectedFileId: possibleFileId 
          };
        }
      } catch (error) {
        console.log('Root search failed:', error instanceof Error ? error.message : 'Unknown error');
      }
      
      // If not in root, search recursively through folders
      const searchInFolder = async (folderId?: string, currentPath: string[] = []): Promise<{ folderPath: string[], selectedFileId: string } | null> => {
        try {
          const content = await getLibraryContent(selectedOrganizationId!, folderId);
          const items = content?.content || [];
          
          // Check if document is in current folder
          const foundFile = items.find((item: LibraryItem) => item.id === possibleFileId && item.type === 'document');
          if (foundFile) {
            console.log('✅ Found document in folder path:', currentPath, 'document:', foundFile.name);
            return {
              folderPath: currentPath,
              selectedFileId: possibleFileId
            };
          }
          
          // Search in subfolders (limit depth to avoid infinite loops)
          if (currentPath.length < 10) {
            const folders = items.filter((item: LibraryItem) => item.type === 'folder');
            for (const folder of folders) {
              const result = await searchInFolder(folder.id, [...currentPath, folder.id]);
              if (result) return result;
            }
          }
          
          return null;
        } catch (error) {
          console.log(`Error searching in folder ${folderId}:`, error instanceof Error ? error.message : 'Unknown error');
          return null;
        }
      };
      
      console.log('🔄 Searching in subfolders...');
      const searchResult = await searchInFolder();
      if (searchResult) {
        return searchResult;
      }
      
      console.log('⚠️ Document not found, treating as file in root');
      return { 
        folderPath: [], 
        selectedFileId: possibleFileId 
      };
    }
    
    // Original logic for multi-segment paths
    const possibleFileId = segments[segments.length - 1];
    const parentFolderPath = segments.slice(0, -1);
    
    console.log('Checking if last segment is file:', possibleFileId);
    console.log('Parent folder path:', parentFolderPath);
    
    // Try two approaches: first check if last segment is a file, then try direct folder access
    
    // Approach 1: Check if last segment is a file by loading parent folder
    try {
      const parentFolderId = parentFolderPath.length > 0 ? parentFolderPath[parentFolderPath.length - 1] : undefined;
      console.log('Checking parent folder ID for file detection:', parentFolderId);
      
      const parentContent = await getLibraryContent(selectedOrganizationId!, parentFolderId);
      const items = parentContent?.content || [];
      console.log('Parent folder items count:', items.length);
      
      const foundFile = items.find((item: LibraryItem) => item.id === possibleFileId && item.type === 'document');
      
      if (foundFile) {
        console.log('✓ Last segment is a file:', foundFile.name);
        return { 
          folderPath: parentFolderPath, 
          selectedFileId: possibleFileId 
        };
      }
    } catch (error) {
      console.log('Parent folder check failed, will try folder approach:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Approach 2: Try to access the full path as folders
    try {
      console.log('Attempting to access as folder path:', segments);
      const lastFolderId = segments[segments.length - 1];
      
      // Try to load content of the last segment as if it's a folder
      const folderContent = await getLibraryContent(selectedOrganizationId!, lastFolderId);
      
      if (folderContent?.content !== undefined) {
        console.log('✓ Last segment is accessible as folder');
        return { 
          folderPath: segments, 
          selectedFileId: null 
        };
      }
    } catch (error) {
      console.log('Folder access failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Approach 3: Fallback - if both fail, try treating as file
    console.log('Using fallback approach - treating last segment as file');
    return { 
      folderPath: parentFolderPath, 
      selectedFileId: possibleFileId 
    };
  };

  // Build URL path from breadcrumb and selected file (memoized for performance)
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

  // Scroll preservation functions
  const saveScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  }, []);

  const restoreScrollPosition = useCallback(() => {
    if (scrollContainerRef.current && preserveScrollRef.current) {
      const savedPosition = scrollPositionRef.current;
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedPosition;
        }
        preserveScrollRef.current = false;
      });
    }
  }, []);

  const preserveScroll = useCallback(() => {
    saveScrollPosition();
    preserveScrollRef.current = true;
  }, [saveScrollPosition]);
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<LibraryItem | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);

  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar(); // Hook para controlar el app sidebar
  const { selectedOrganizationId, organizationToken, resetOrganizationContext } = useOrganization();
  const hasRestoredRef = useRef(false);
  
  // Scroll preservation
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const preserveScrollRef = useRef<boolean>(false);

  // Cerrar app sidebar automáticamente en móvil cuando se accede a Asset
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  // Set up scroll listener para guardar posición periódicamente
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimer: number;
    const handleScroll = () => {
      // Debounce scroll saving to avoid too many updates
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        saveScrollPosition();
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimer);
    };
  }, [saveScrollPosition]);

  // Restore scroll after content updates
  useEffect(() => {
    if (preserveScrollRef.current) {
      const timeoutId = setTimeout(restoreScrollPosition, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [restoreScrollPosition, selectedFile, selectedExecutionId]);

  // Get current folder ID (last item in breadcrumb or undefined for root)
  const currentFolderId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : undefined;

  // Fetch library content for current folder (optimized with staleTime)
  const { error } = useQuery({
    queryKey: ['library', selectedOrganizationId, currentFolderId],
    queryFn: () => getLibraryContent(selectedOrganizationId!, currentFolderId),
    enabled: !!selectedOrganizationId && !!organizationToken, // Esperar a que tanto org como token estén disponibles
    staleTime: 30000, // Cache for 30 seconds to avoid unnecessary refetches
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: false,
  });

  // Handle refresh library content
  const handleRefresh = async () => {
    // Invalidar todas las queries relacionadas con la library de esta organización
    queryClient.invalidateQueries({ queryKey: ['library', selectedOrganizationId] });
  };

  // Load folder hierarchy by reconstructing the path
  const loadFolderHierarchy = async (folderIds: string[]): Promise<BreadcrumbItem[]> => {
    console.log('Loading folder hierarchy for path:', folderIds);
    const hierarchy: BreadcrumbItem[] = [];
    let currentFolderId: string | undefined = undefined;
    
    for (let i = 0; i < folderIds.length; i++) {
      const targetFolderId = folderIds[i];
      console.log(`Loading folder ${i + 1}/${folderIds.length}: ${targetFolderId} in parent: ${currentFolderId || 'root'}`);
      
      try {
        // Get content of current folder to find the target folder
        const data = await getLibraryContent(selectedOrganizationId!, currentFolderId);
        console.log('Parent folder content:', data?.content?.length, 'items');
        
        if (!data?.content) {
          console.error('No content returned from API');
          break;
        }
        
        const folders = data.content.filter((item: LibraryItem) => item.type === 'folder');
        console.log('Available folders:', folders.map((f: LibraryItem) => ({ id: f.id, name: f.name })));
        
        // Find the folder with the target ID
        const targetFolder = folders.find((folder: LibraryItem) => folder.id === targetFolderId);
        
        if (targetFolder) {
          console.log(`✓ Found folder: ${targetFolder.name} (${targetFolder.id})`);
          hierarchy.push({ id: targetFolder.id, name: targetFolder.name });
          currentFolderId = targetFolder.id;
        } else {
          console.warn(`✗ Folder ${targetFolderId} not found. Stopping hierarchy load.`);
          console.warn('Available folder IDs:', folders.map((f: LibraryItem) => f.id));
          
          // If we found at least some of the hierarchy, return what we have
          if (hierarchy.length > 0) {
            console.log('Returning partial hierarchy:', hierarchy);
            return hierarchy;
          }
          break;
        }
      } catch (error) {
        console.error(`✗ Error loading folder hierarchy at ${targetFolderId}:`, error);
        // Return what we have so far if any
        if (hierarchy.length > 0) {
          console.log('Returning partial hierarchy due to error:', hierarchy);
          return hierarchy;
        }
        break;
      }
    }
    
    console.log('Final complete hierarchy:', hierarchy);
    return hierarchy;
  };

  // Initialize from URL on mount and when URL changes
  useEffect(() => {
    if (!selectedOrganizationId || !organizationToken) return; // Skip if no organization context
    if (isUpdatingUrl) {
      console.log('Skipping URL initialization - currently updating URL');
      return; // Skip if we're updating URL programmatically
    }
    
    const initializeFromUrl = async () => {
      try {
        console.log('Initializing from URL:', location.pathname);
        setIsLoadingDocument(true);
        const { folderPath, selectedFileId } = await parseUrlPath();
        console.log('Parsed URL result:', { folderPath, selectedFileId });
        
        if (folderPath.length > 0) {
          try {
            console.log('Loading folder hierarchy...');
            // Load folder hierarchy
            const hierarchy = await loadFolderHierarchy(folderPath);
            console.log('Loaded hierarchy:', hierarchy);
            
            if (hierarchy.length > 0) {
              setBreadcrumb(hierarchy);
              console.log('Breadcrumb set to:', hierarchy);
              
              // If we only got a partial hierarchy, update the URL to reflect the actual navigable path
              if (hierarchy.length < folderPath.length) {
                console.log('Partial hierarchy loaded, updating URL to match reality');
                const actualUrl = buildUrlPath(hierarchy, selectedFileId || undefined);
                navigate(actualUrl, { replace: true });
                
                // Show a warning to the user
                setTimeout(async () => {
                  const { toast } = await import("sonner");
                  toast.warning(`Some folders in the URL path could not be found. Navigated to the deepest accessible folder.`);
                }, 100);
              }
            } else {
              console.warn('No valid hierarchy found, redirecting to root');
              // If we can't load the hierarchy, redirect to root
              navigate('/asset', { replace: true });
              return;
            }
          } catch (error) {
            console.error('Error loading folder hierarchy from URL:', error);
            // Redirect to root on error
            navigate('/asset', { replace: true });
            return;
          }
        } else {
          // Clear breadcrumb if we're at root
          setBreadcrumb([]);
        }
        
        if (selectedFileId) {
          try {
            console.log('Loading selected file details...');
            // Load the current folder content to find the selected file details
            const currentFolderId = folderPath.length > 0 ? folderPath[folderPath.length - 1] : undefined;
            const data = await getLibraryContent(selectedOrganizationId!, currentFolderId);
            const files = data?.content || [];
            console.log('Files in current folder:', files);
            
            // Find the selected file to get its proper name and type
            const selectedDoc = files.find((item: LibraryItem) => item.id === selectedFileId);
            console.log('Found selected document:', selectedDoc);
            
            if (selectedDoc) {
              setSelectedFile(selectedDoc);
              console.log('Selected file set to:', selectedDoc);
            } else {
              console.warn('Selected file not found in folder, using fallback');
              // Fallback if file not found
              setSelectedFile({
                id: selectedFileId,
                name: `Document ${selectedFileId.substring(0, 8)}...`,
                type: 'document'
              });
            }
          } catch (error) {
            console.error('Error loading selected file details:', error);
            // Try to set file anyway as fallback
            setSelectedFile({
              id: selectedFileId,
              name: `Document ${selectedFileId.substring(0, 8)}...`,
              type: 'document'
            });
          }
        } else {
          // Clear selected file if no file in URL
          setSelectedFile(null);
        }
        
        console.log('URL initialization completed');
      } catch (error) {
        console.error('Error initializing from URL:', error);
        // Redirect to root on any error
        navigate('/asset', { replace: true });
      } finally {
        setIsLoadingDocument(false);
      }
    };
    
    // Check if this is first load or URL change
    if (!hasRestoredRef.current) {
      // First load - check sessionStorage as fallback
      const savedBreadcrumb = sessionStorage.getItem('library-breadcrumb');
      const savedSelectedFile = sessionStorage.getItem('library-selectedFile');
      
      if (location.pathname !== '/asset') {
        // URL has path, use URL
        initializeFromUrl();
      } else if (savedBreadcrumb) {
        // No URL path, use sessionStorage
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
      // URL changed after initial load - always reinitialize from URL
      initializeFromUrl();
    }
  }, [selectedOrganizationId, organizationToken, location.pathname]); // Remover isUpdatingUrl de las dependencias

  // Sync sessionStorage when breadcrumb or selectedFile changes
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

  // Update URL when selected file or breadcrumb changes (debounced to avoid rapid changes)
  useEffect(() => {
    // Solo actualizar si ya hemos restaurado y tenemos contexto organizacional
    if (!hasRestoredRef.current || !selectedOrganizationId || !organizationToken) return;
    
    const newUrl = buildUrlPath(breadcrumb, selectedFile?.id);
    
    // Solo actualizar URL si es diferente de la actual y no estamos ya actualizando
    if (location.pathname !== newUrl && !isUpdatingUrl) {
      console.log('Updating URL to reflect current state:', newUrl);
      setIsUpdatingUrl(true);
      navigate(newUrl, { replace: true });
      
      // Reset flag después de un breve delay
      setTimeout(() => {
        setIsUpdatingUrl(false);
      }, 200); // Aumentar el timeout ligeramente
    }
  }, [breadcrumb, selectedFile, buildUrlPath, navigate, location.pathname, selectedOrganizationId, organizationToken, hasRestoredRef.current]);

  // Ref para rastrear la organización anterior y evitar resets innecesarios
  const prevOrganizationIdRef = useRef<string | null>(null);
  
  // Reset state when organization actually changes (not just re-renders)
  useEffect(() => {
    // Solo resetear si la organización realmente cambió (no solo re-renderizado)
    if (prevOrganizationIdRef.current !== null && 
        prevOrganizationIdRef.current !== selectedOrganizationId) {
      
      console.log('Organization actually changed, resetting state');
      setBreadcrumb([]);
      setSelectedFile(null);
      setSelectedExecutionId(null);
      hasRestoredRef.current = false; // Reset so it can initialize again
      
      // Clear session storage for the previous organization
      sessionStorage.removeItem('library-breadcrumb');
      sessionStorage.removeItem('library-selectedFile');
      
      // Navigate to root assets page if we're currently on a specific document/folder path
      if (location.pathname !== '/asset') {
        console.log('Organization changed, navigating to assets root');
        setIsUpdatingUrl(true);
        navigate('/asset', { replace: true });
        setTimeout(() => setIsUpdatingUrl(false), 200);
      }
    }
    
    // Actualizar la referencia de la organización anterior
    prevOrganizationIdRef.current = selectedOrganizationId;
  }, [selectedOrganizationId, navigate, location.pathname]);

  // Handle navigation state to restore selected document and breadcrumb
  useEffect(() => {
    const navigationState = location.state as LibraryNavigationState | undefined;

    if (navigationState?.selectedDocumentId && navigationState?.selectedDocumentName) {
      // Restore selected file
      setSelectedFile({
        id: navigationState.selectedDocumentId,
        name: navigationState.selectedDocumentName,
        type: navigationState.selectedDocumentType || "document"
      });
      
      // Restore breadcrumb if requested
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
      
      // Clear the state after using it
      navigate(location.pathname, { replace: true });
    }
    
    // Handle returning from graph page
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
          setSelectedFile(parsedSelectedFile);
        } catch (error) {
          console.error('Error parsing saved selected file:', error);
        }
      }
      
      // Clear the state after using it
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, location.pathname, navigate]);

  // Document content query is now handled by AssetContent component

  // Initialize selected execution ID when a document is selected
  useEffect(() => {
    if (selectedFile?.type === 'document') {
      // Reset execution ID when document changes
      setSelectedExecutionId(null);
    }
  }, [selectedFile?.id]);

  // Check for permission errors separately to show specific message
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const isPermissionError = errorMessage.includes('no tiene ningún rol') || 
                           errorMessage.includes('no permission') ||
                           errorMessage.includes('insufficient privileges') ||
                           errorMessage.includes('access denied');

  if (!selectedOrganizationId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-blue-100 rounded-full">
            <FolderIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Organización Requerida</h2>
          <p className="text-sm text-gray-600">
            Por favor selecciona una organización para ver los assets.
          </p>
        </div>
      </div>
    );
  }

  if (isPermissionError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-amber-100 rounded-full">
            <FileText className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            No tienes los permisos necesarios para acceder a los assets de esta organización.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            Por favor contacta a tu administrador para que te asigne el rol apropiado.
          </p>
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Reset organization selection to allow user to choose a different one
                resetOrganizationContext();
              }}
              className="hover:cursor-pointer w-full"
            >
              Cambiar Organización
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex min-w-0 h-full relative">
        {isLoadingDocument && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <FolderIcon className="h-8 w-8 animate-pulse text-blue-500 mr-2" />
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700">Loading document...</p>
              <p className="text-xs text-gray-500 mt-1">Please wait a moment</p>
            </div>
          </div>
        )}
        <div ref={scrollContainerRef} className="flex-1 overflow-hidden max-h-[calc(100vh-64px)] bg-white min-w-0">
          <AssetContent
            selectedFile={selectedFile}
            breadcrumb={breadcrumb}
            selectedExecutionId={selectedExecutionId}
            setSelectedExecutionId={setSelectedExecutionId}
            setSelectedFile={setSelectedFile}
            onRefresh={handleRefresh}
            currentFolderId={currentFolderId}
            isSidebarOpen={false}
            onToggleSidebar={() => {}}
            onPreserveScroll={preserveScroll}
          />
        </div>
      </div>
    </div>
  );
}

// Componente envoltorio que provee el contexto de carpetas expandidas
export default function Assets() {
  return (
    <ExpandedFoldersProvider>
      <AssetsContent />
    </ExpandedFoldersProvider>
  );
}
