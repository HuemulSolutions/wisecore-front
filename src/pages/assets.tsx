import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { File, Plus, Network, Folder as FolderIcon, FileText, Search, FolderTree, MoreVertical, RefreshCw } from "lucide-react"; 
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLibraryContent } from "@/services/library";
import { FileTreeWithSearchAndContext, AssetContent, CreateFolderDialog, CreateAssetDialog } from "@/components/assets";
import type { FileNode, LibraryItem, BreadcrumbItem, LibraryNavigationState } from "@/components/assets";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";

import { useOrganization } from "@/contexts/organization-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { CollapsibleSidebar } from "@/components/ui/collapsible-sidebar";
import { DropdownMenuGroup } from "@radix-ui/react-dropdown-menu";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { ExpandedFoldersProvider, useExpandedFolders } from "@/hooks/use-expanded-folders";

function AssetsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [assetDialogOpen, setAssetDialogOpen] = useState(false)

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
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<LibraryItem | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar(); // Hook para controlar el app sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !isMobile); // Closed by default on mobile
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedOrganizationId, resetOrganizationContext } = useOrganization();
  const hasRestoredRef = useRef(false);
  const { canCreate, canAccessFolders, canAccessAssets } = useUserPermissions();
  const { getExpandedFolderIds, reExpandFolders } = useExpandedFolders();

  // Cerrar app sidebar automáticamente en móvil cuando se accede a Asset
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  // Get current folder ID (last item in breadcrumb or undefined for root)
  const currentFolderId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : undefined;

  // Fetch library content for current folder (optimized with staleTime)
  const { data: libraryData, isLoading, error, isFetching } = useQuery({
    queryKey: ['library', selectedOrganizationId, currentFolderId],
    queryFn: () => getLibraryContent(selectedOrganizationId!, currentFolderId),
    enabled: !!selectedOrganizationId,
    staleTime: 30000, // Cache for 30 seconds to avoid unnecessary refetches
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: false,
  });

  const currentItems = libraryData?.content || [];

  // Convert LibraryItem to FileNode (memoized for performance)
  const convertToFileNodes = useMemo(() => {
    return (items: LibraryItem[]): FileNode[] => {
      return items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type === 'folder' ? 'folder' as const : 'file' as const,
        children: item.type === 'folder' ? [] : undefined,
        icon: item.type === 'folder' ? 'folder' : 'file',
        document_type: item.document_type,
        access_levels: item.access_levels,
      }));
    };
  }, []);

  // Filter items based on search (memoized)
  const filteredItems = useMemo((): LibraryItem[] => {
    if (!searchTerm) return currentItems;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return currentItems.filter((item: LibraryItem) => 
      item.name.toLowerCase().includes(lowerSearchTerm)
    );
  }, [currentItems, searchTerm]);

  // Create items with back button when in subfolder (memoized to avoid unnecessary re-renders)
  const treeItems = useMemo((): FileNode[] => {
    const fileNodes = convertToFileNodes(filteredItems);
    
    // If we're in a subfolder, add a back button
    if (breadcrumb.length > 0) {
      const backNode: FileNode = {
        id: '__back__',
        name: '← Back',
        type: 'folder',
        icon: 'back'
      };
      return [backNode, ...fileNodes];
    }
    
    return fileNodes;
  }, [convertToFileNodes, filteredItems, breadcrumb.length]);

  // Handle file/folder selection from tree (optimized to reduce re-renders)
  const handleTreeSelect = useCallback((item: FileNode) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    console.log(`🎯 [${timestamp}] handleTreeSelect called for "${item.name}" (${item.type})`);
    
    // Handle special back button
    if (item.id === '__back__') {
      const newBreadcrumb = breadcrumb.slice(0, -1);
      setBreadcrumb(newBreadcrumb);
      setSelectedFile(null);
      
      // Update URL
      const newUrl = buildUrlPath(newBreadcrumb);
      navigate(newUrl, { replace: true });
      return;
    }

    if (item.type === 'file') {
      console.log(`📄 [${timestamp}] Processing file selection for "${item.name}"`);
      
      // ACTIVAR LOADING INMEDIATAMENTE
      console.log(`⚡ [${timestamp}] ACTIVATING LOADING for "${item.name}"`);
      
      // Find the full item data from currentItems to get access_levels
      const fullItemData = currentItems.find((libraryItem: LibraryItem) => libraryItem.id === item.id);
      console.log(`🔍 [${timestamp}] Found fullItemData:`, fullItemData ? 'Yes' : 'No');
      
      // Use access_levels from FileNode first, fallback to fullItemData
      const accessLevels = item.access_levels || fullItemData?.access_levels;
      console.log(`🔐 [${timestamp}] Access levels:`, accessLevels);
      
      // Select document with all necessary data including access_levels
      const selectedDoc: LibraryItem = {
        id: item.id,
        name: item.name,
        type: 'document' as const,
        document_type: item.document_type || fullItemData?.document_type,
        access_levels: accessLevels
      };
      console.log(`📝 [${timestamp}] Setting selectedFile:`, selectedDoc);
      setSelectedFile(selectedDoc);
      
      // Update URL to include the selected file
      const newUrl = buildUrlPath(breadcrumb, item.id);
      console.log(`🌐 [${timestamp}] Navigating to URL:`, newUrl);
      navigate(newUrl, { replace: true });
      
      // DESACTIVAR LOADING DESPUÉS DE UN DELAY
      setTimeout(() => {
        const endTimestamp = new Date().toISOString().split('T')[1].slice(0, 12);
        console.log(`⚪ [${endTimestamp}] DEACTIVATING LOADING for "${item.name}"`);
        console.log(`💫 [${endTimestamp}] Loading deactivated for "${item.name}"`);
      }, 400);
      
      console.log(`✅ [${timestamp}] handleTreeSelect completed for file "${item.name}"`);
    }
    // For folders, we let the FileTree handle expansion internally
    // The onDoubleClick will handle navigation
  }, [breadcrumb, currentItems, navigate]);

  // Handle double click for folder navigation (optimized)
  const handleTreeDoubleClick = useCallback((item: FileNode) => {
    if (item.type === 'folder' && item.id !== '__back__') {
      // Navigate into folder using breadcrumb
      const newBreadcrumb = [...breadcrumb, { id: item.id, name: item.name }];
      setBreadcrumb(newBreadcrumb);
      setSelectedFile(null);
      
      // Update URL
      const newUrl = buildUrlPath(newBreadcrumb);
      navigate(newUrl, { replace: true });
    }
  }, [breadcrumb, navigate]);

  // Handle loading children for folders (lazy loading, optimized)
  const handleLoadChildren = useCallback(async (folderId: string): Promise<FileNode[]> => {
    try {
      const data = await getLibraryContent(selectedOrganizationId!, folderId);
      return convertToFileNodes(data?.content || []);
    } catch (error) {
      console.error('Error loading folder children:', error);
      return [];
    }
  }, [selectedOrganizationId, convertToFileNodes]);

  // Get current folder ID for create operations
  const getCurrentFolderId = (): string | undefined => {
    if (breadcrumb.length === 0) return undefined;
    return breadcrumb[breadcrumb.length - 1].id;
  };

  // Handle document creation
  const handleDocumentCreated = (createdDocument: { id: string; name: string; type: "document" }) => {
    handleRefresh();
    setSelectedFile(createdDocument);
  };

  // Handle navigation to graph
  const handleGraphNavigation = () => {
    sessionStorage.setItem('library-breadcrumb', JSON.stringify(breadcrumb));
    if (selectedFile) {
      sessionStorage.setItem('library-selectedFile', JSON.stringify(selectedFile));
    }
    
    navigate('/graph', {
      state: {
        fromLibrary: true,
        breadcrumb: breadcrumb,
        selectedFile: selectedFile
      }
    });
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

  // Initialize from URL on mount
  useEffect(() => {
    if (hasRestoredRef.current || !selectedOrganizationId) return;
    
    const initializeFromUrl = async () => {
      try {
        console.log('Initializing from URL:', location.pathname);
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
        }
        
        console.log('URL initialization completed');
      } catch (error) {
        console.error('Error initializing from URL:', error);
        // Redirect to root on any error
        navigate('/asset', { replace: true });
      }
    };
    
    // Also check sessionStorage as fallback
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
  }, [selectedOrganizationId, location.pathname]);

  // Sync sessionStorage when breadcrumb changes
  useEffect(() => {
    if (hasRestoredRef.current) {
      sessionStorage.setItem('library-breadcrumb', JSON.stringify(breadcrumb));
    }
  }, [breadcrumb]);

  // Sync sessionStorage when selected file changes
  useEffect(() => {
    if (hasRestoredRef.current) {
      if (selectedFile) {
        sessionStorage.setItem('library-selectedFile', JSON.stringify(selectedFile));
      } else {
        sessionStorage.removeItem('library-selectedFile');
      }
    }
  }, [selectedFile]);

  // Persistir breadcrumb en cada cambio
  useEffect(() => {
    sessionStorage.setItem('library-breadcrumb', JSON.stringify(breadcrumb));
  }, [breadcrumb]);

  // Persistir / limpiar archivo seleccionado y actualizar URL
  useEffect(() => {
    if (selectedFile) {
      sessionStorage.setItem('library-selectedFile', JSON.stringify(selectedFile));
      
      // Update URL only if we're not in the middle of initialization
      if (hasRestoredRef.current) {
        const newUrl = buildUrlPath(breadcrumb, selectedFile.id);
        const currentUrl = location.pathname;
        if (newUrl !== currentUrl) {
          navigate(newUrl, { replace: true });
        }
      }
    } else {
      sessionStorage.removeItem('library-selectedFile');
      
      // Update URL to show just the folder if no file is selected
      if (hasRestoredRef.current) {
        const newUrl = buildUrlPath(breadcrumb);
        const currentUrl = location.pathname;
        if (newUrl !== currentUrl) {
          navigate(newUrl, { replace: true });
        }
      }
    }
  }, [selectedFile, breadcrumb, navigate, location.pathname]);

  // Reset state when organization changes
  useEffect(() => {
    setBreadcrumb([]);
    setSelectedFile(null);
    setSelectedExecutionId(null);
  }, [selectedOrganizationId]);

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



  // Handle refresh library content
  const handleRefresh = async () => {
    // Guardar las carpetas actualmente expandidas antes del refresh
    const expandedFolderIds = getExpandedFolderIds();
    console.log('📁 Preserving expanded folders before refresh:', expandedFolderIds);
    
    // Invalidar todas las queries relacionadas con la library de esta organización
    queryClient.invalidateQueries({ queryKey: ['library', selectedOrganizationId] });
    
    // Si hay carpetas expandidas, esperamos un poco y luego las re-expandimos
    if (expandedFolderIds.length > 0) {
      console.log('⏳ Starting re-expansion process in 1.5 seconds...');
      // Esperar a que las queries se invaliden y recarguen
      setTimeout(async () => {
        console.log('🔄 Re-expanding folders after refresh...');
        try {
          await reExpandFolders(expandedFolderIds, handleLoadChildren);
          console.log('✅ Re-expansion process completed successfully');
        } catch (error) {
          console.error('❌ Error during re-expansion process:', error);
        }
      }, 1500);
    } else {
      console.log('📭 No expanded folders to restore');
    }
  };

  // Handle sharing - generate URL based on current breadcrumb and item path
  const handleShare = async (item: FileNode, fullPath: string[], isAutomatic = false) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    console.log(`🔗 [${timestamp}] === HANDLE SHARE START === for "${item.name}" (${item.type}) - ${isAutomatic ? 'AUTO' : 'MANUAL'}`);
    try {
      console.log(`📁 [${timestamp}] Current breadcrumb:`, breadcrumb.map(b => `${b.name}(${b.id})`));
      console.log(`🛤️  [${timestamp}] Item full path from component:`, fullPath);
      
      // The fullPath should already contain the complete path from root to the item
      // When we're in a subfolder (breadcrumb.length > 0), we need to combine them
      // When we're at root (breadcrumb.length === 0), fullPath is already complete
      let completePath: string[];
      
      if (breadcrumb.length > 0) {
        // We're in a subfolder, combine breadcrumb + fullPath
        completePath = [...breadcrumb.map(b => b.id), ...fullPath];
      } else {
        // We're at root, fullPath is already complete from root
        completePath = fullPath;
      }
      
      console.log(`🎯 Final complete path:`, completePath);
      
      // Build the URL
      let shareUrl = `${window.location.origin}/asset`;
      if (completePath.length > 0) {
        shareUrl += '/' + completePath.join('/');
      }
      
      // For automatic calls (file selection), only update browser URL without changing navigation
      if (isAutomatic && item.type === 'file' && completePath.length > 0) {
        console.log(`🔄 [${timestamp}] Auto-updating ONLY browser URL for selected file: ${item.name}`);
        console.log(`🔄 [${timestamp}] Complete path from component:`, completePath);
        
        // Build the complete URL directly from the full path
        const completeUrl = `/asset/${completePath.join('/')}`;
        console.log(`🔄 [${timestamp}] Auto-corrected browser URL (URL only):`, completeUrl);
        
        console.log(`⏳ [${timestamp}] Adding 100ms delay to show loading state`);
        // Add a small delay to show the loading state
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`⏳ [${timestamp}] Delay completed, calling navigate`);
        
        // Only update the browser URL, DO NOT change breadcrumb or navigation state
        navigate(completeUrl, { replace: true });
        console.log(`🌐 [${timestamp}] Navigate called successfully`);
      }
      
      // Only copy to clipboard and show toast for manual shares
      if (!isAutomatic) {
        // Copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        
        console.log(`✅ URL generated: ${shareUrl}`);
        console.log(`📋 Copied to clipboard successfully`);
        
        // Show success message
        const { toast } = await import("sonner");
        toast.success(`Link for "${item.name}" copied to clipboard!`);
      } else {
        console.log(`✅ [${timestamp}] URL auto-generated: ${shareUrl}`);
      }
      
      console.log(`🏁 [${timestamp}] === HANDLE SHARE COMPLETED === for "${item.name}"`);
    } catch (error) {
      console.error(`❌ [${timestamp}] Error in share handler:`, error);
      if (!isAutomatic) {
        const { toast } = await import("sonner");
        toast.error('Failed to copy link to clipboard');
      }
      console.log(`💥 [${timestamp}] === HANDLE SHARE FAILED === for "${item.name}"`);
      // Re-throw para que el componente del file tree pueda manejar el error
      throw error;
    }
  };


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
            <File className="h-8 w-8 text-amber-600" />
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

  const handleCreateFolder = () => {
    // Use setTimeout so the dropdown menu fully closes before the dialog appears
    setTimeout(() => {
      setFolderDialogOpen(true)
    }, 0)
  }

  const handleCreateAsset = () => {
    // Use setTimeout so the dropdown menu fully closes before the dialog appears
    setTimeout(() => {
      setAssetDialogOpen(true)
    }, 0)
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* File Tree Sidebar */}
      <CollapsibleSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        position="left"
        toggleAriaLabel={isSidebarOpen ? "Cerrar sidebar" : "Abrir sidebar"}
        mobileTitle="Asset Navigator"
        customToggleIcon={<FolderTree className="h-4 w-4" />}
        customToggleIconMobile={<FolderTree className="h-5 w-5" />}
        showToggleButton={!isMobile} // Hide toggle button on mobile, use external one
        header={
          <>
            <div className="p-4 flex-shrink-0">
              {/* Action Buttons */}
              <div className="flex items-center justify-start gap-2 md:justify-between mb-4">
                {/* <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGraphNavigation}
                    >
                      <Network className="h-4 w-4 text-gray-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Asset relationships</p>
                  </TooltipContent>
                </Tooltip> */}

                <div className="flex items-center gap-2">
                  {(canAccessFolders && canCreate('folder')) || (canAccessAssets && canCreate('assets')) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="min-w-40"
                      >
                      {canAccessFolders && canCreate('folder') && (
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            className="hover:cursor-pointer"
                            onSelect={handleCreateFolder}
                          >
                            <FolderIcon className="h-4 w-4 mr-2"></FolderIcon>
                            Create Folder
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      )}
                      {canAccessAssets && canCreate('assets') && (
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            className="hover:cursor-pointer"
                            onSelect={handleCreateAsset}
                          >
                            <FileText className="h-4 w-4 mr-2"></FileText>
                            Create Asset
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isFetching}
                    className="hover:cursor-pointer h-8 text-xs px-2"
                  >
                    <RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-8 text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Breadcrumb display */}
            {breadcrumb.length > 0 && (
              <div className="px-4 py-2 bg-muted/50 flex-shrink-0">
                <div className="text-xs font-medium text-muted-foreground mb-1">Current Location</div>
                <div className="text-sm">
                  <span className="hover:cursor-pointer text-primary hover:underline" onClick={() => {
                    setBreadcrumb([]);
                    setSelectedFile(null);
                    // Navigate to root asset
                    navigate('/asset', { replace: true });
                  }}>
                    Asset
                  </span>
                  {breadcrumb.map((item, index) => (
                    <span key={item.id}>
                      <span className="mx-1 text-muted-foreground">/</span>
                      <span 
                        className="hover:cursor-pointer text-primary hover:underline"
                        onClick={() => {
                          const newBreadcrumb = breadcrumb.slice(0, index + 1);
                          setBreadcrumb(newBreadcrumb);
                          setSelectedFile(null);
                          // Update URL to reflect navigation
                          const newUrl = buildUrlPath(newBreadcrumb);
                          navigate(newUrl, { replace: true });
                        }}
                      >
                        {item.name}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        }
      >
        {/* File Tree Content */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex-1 p-2 overflow-auto min-h-[80vh] max-h-[80vh]">
              {error && !isPermissionError ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg p-8 mx-2">
                  <p className="text-red-600 mb-4 font-medium text-sm">
                    {'Failed to load assets'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    There was an error loading the content. Please try again.
                  </p>
                  <Button 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['library', selectedOrganizationId, currentFolderId] })} 
                    variant="outline" 
                    size="sm"
                    className="hover:cursor-pointer h-8"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : isLoading || isFetching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      <FolderIcon className="h-8 w-8 animate-pulse text-blue-500 mr-2" />
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700">Cargando assets...</p>
                    <p className="text-xs text-gray-500 mt-1">Por favor espera un momento</p>
                  </div>
                </div>
              ) : (
                <>
                  <FileTreeWithSearchAndContext
                    items={treeItems}
                    onSelect={handleTreeSelect}
                    onDoubleClick={handleTreeDoubleClick}
                    showSearch={false}
                    searchPlaceholder="Search files..."
                    onLoadChildren={handleLoadChildren}
                    selectedId={selectedFile?.id}
                    onRefresh={handleRefresh}
                    onDocumentCreated={handleDocumentCreated}
                    onShare={(item, fullPath, isAutoShare) => {
                      // Use the isAutoShare flag passed from the component
                      handleShare(item, fullPath, Boolean(isAutoShare));
                    }}
                  />
                  
                  {/* Message for empty area */}
                  {treeItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm mb-2">No items in this folder</p>
                      <p className="text-xs">Right-click to create new items</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </ContextMenuTrigger>
          
          <ContextMenuContent>
            {canAccessAssets && canCreate('assets') && (
              <ContextMenuItem 
                className="hover:cursor-pointer"
                onSelect={handleCreateAsset}
              >
                <FileText className="h-4 w-4 mr-2" />
                New Asset
              </ContextMenuItem>
            )}
            <ContextMenuItem className="hover:cursor-pointer" onClick={() => console.log('More options clicked')}>
              <MoreVertical className="h-4 w-4 mr-2" />
              More Options
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </CollapsibleSidebar>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 h-full">
        <div className="flex-1 overflow-auto bg-white min-w-0">
          <AssetContent
            selectedFile={selectedFile}
            breadcrumb={breadcrumb}
            selectedExecutionId={selectedExecutionId}
            setSelectedExecutionId={setSelectedExecutionId}
            setSelectedFile={setSelectedFile}
            onRefresh={handleRefresh}
            currentFolderId={currentFolderId}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>
      </div>
      
      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={folderDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFolderDialogOpen(false)
          }
        }}
        parentFolder={getCurrentFolderId()}
        onFolderCreated={handleRefresh}
      />
      
      {/* Create Asset Dialog */}
      <CreateAssetDialog
        open={assetDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAssetDialogOpen(false)
          }
        }}
        folderId={getCurrentFolderId()}
        onAssetCreated={handleDocumentCreated}
      />
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
