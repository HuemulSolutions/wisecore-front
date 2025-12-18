import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { File, Plus, Network, Folder as FolderIcon, FileText, Search, FolderTree, MoreVertical } from "lucide-react"; 
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLibraryContent } from "@/services/library";
import { getDocumentContent } from "@/services/documents";
import { FileTreeWithSearchAndContext } from "@/components/file tree/file-tree-with-search-and-context";
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
import type { FileNode } from "@/components/file tree/types";
import { AssetContent } from "@/components/library/new-library-content";
import { DropdownMenuGroup } from "@radix-ui/react-dropdown-menu";
import { CreateFolderDialog } from "@/components/create_folder";
import { CreateAssetDialog } from "@/components/create-asset-dialog";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { ExpandedFoldersProvider, useExpandedFolders } from "@/hooks/use-expanded-folders";

// API response interface
interface LibraryItem {
  id: string;
  name: string;
  type: "folder" | "document";
  document_type?: {
    id: string;
    name: string;
    color: string;
  };
  access_levels?: string[];
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

type LibraryNavigationState = {
  selectedDocumentId?: string;
  selectedDocumentName?: string;
  selectedDocumentType?: "document" | "folder";
  restoreBreadcrumb?: boolean;
  breadcrumb?: BreadcrumbItem[];
  fromLibrary?: boolean;
};

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
    
    // We need to determine if the last segment is a file or folder
    // We'll try to load the parent folder and check if the last segment exists as a file
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

  // Build URL path from breadcrumb and selected file
  const buildUrlPath = (breadcrumb: BreadcrumbItem[], selectedFileId?: string) => {
    let path = '/asset';
    
    if (breadcrumb.length > 0) {
      const folderPath = breadcrumb.map(item => encodeURIComponent(item.id)).join('/');
      path += '/' + folderPath;
    }
    
    if (selectedFileId) {
      path += '/' + encodeURIComponent(selectedFileId);
    }
    
    return path;
  };
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

  // Convert LibraryItem to FileNode
  const convertToFileNodes = (items: LibraryItem[]): FileNode[] => {
    return items.map(item => {
      console.log(`🔄 Converting LibraryItem to FileNode [${item.name}]:`, {
        name: item.name,
        type: item.type,
        has_access_levels: !!item.access_levels,
        access_levels: item.access_levels,
        document_type: item.document_type
      });
      
      return {
        id: item.id,
        name: item.name,
        type: item.type === 'folder' ? 'folder' as const : 'file' as const,
        children: item.type === 'folder' ? [] : undefined,
        icon: item.type === 'folder' ? 'folder' : 'file',
        document_type: item.document_type,
        access_levels: item.access_levels,
      };
    });
  };

  // Filter items based on search
  const getFilteredItems = (): LibraryItem[] => {
    if (!searchTerm) return currentItems;
    return currentItems.filter((item: LibraryItem) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };





  // Handle file/folder selection from tree  
  const handleTreeSelect = (item: FileNode) => {
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
      console.log('🔍 FileNode item data:', item);
      console.log('🔍 FileNode access_levels:', item.access_levels);
      
      // Find the full item data from currentItems to get access_levels
      const fullItemData = currentItems.find((libraryItem: LibraryItem) => libraryItem.id === item.id);
      console.log('🔍 Full item data from currentItems:', fullItemData);
      
      // Use access_levels from FileNode first, fallback to fullItemData
      const accessLevels = item.access_levels || fullItemData?.access_levels;
      console.log('🔍 Final access levels being used:', accessLevels);
      
      // Select document with all necessary data including access_levels
      const selectedDoc: LibraryItem = {
        id: item.id,
        name: item.name,
        type: 'document' as const,
        document_type: item.document_type || fullItemData?.document_type,
        access_levels: accessLevels
      };
      setSelectedFile(selectedDoc);
      
      // Update URL to include the selected file
      const newUrl = buildUrlPath(breadcrumb, item.id);
      navigate(newUrl, { replace: true });
      
      console.log('🔍 File selected with access levels:', selectedDoc.access_levels);
    }
    // For folders, we let the FileTree handle expansion internally
    // The onDoubleClick will handle navigation
  };

  // Handle double click for folder navigation
  const handleTreeDoubleClick = (item: FileNode) => {
    if (item.type === 'folder' && item.id !== '__back__') {
      // Navigate into folder using breadcrumb
      const newBreadcrumb = [...breadcrumb, { id: item.id, name: item.name }];
      setBreadcrumb(newBreadcrumb);
      setSelectedFile(null);
      
      // Update URL
      const newUrl = buildUrlPath(newBreadcrumb);
      navigate(newUrl, { replace: true });
    }
  };

  // Handle loading children for folders (lazy loading)
  const handleLoadChildren = async (folderId: string): Promise<FileNode[]> => {
    try {
      const data = await getLibraryContent(selectedOrganizationId!, folderId);
      return convertToFileNodes(data?.content || []);
    } catch (error) {
      console.error('Error loading folder children:', error);
      return [];
    }
  };

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

  // Fetch document content when a document is selected
  const { refetch: refetchDocumentContent } = useQuery({
    queryKey: ['document-content', selectedFile?.id, selectedExecutionId],
    queryFn: () => getDocumentContent(selectedFile!.id, selectedOrganizationId!, selectedExecutionId || undefined),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id && !!selectedOrganizationId,
  });

  // Initialize selected execution ID when a document is selected
  useEffect(() => {
    if (selectedFile?.type === 'document') {
      // Reset execution ID when document changes
      setSelectedExecutionId(null);
    }
  }, [selectedFile?.id]);

  // Get current folder ID (last item in breadcrumb or undefined for root)
  const currentFolderId = breadcrumb.length > 0 ? breadcrumb[breadcrumb.length - 1].id : undefined;

  // Fetch library content for current folder
  const { data: libraryData, isLoading, error } = useQuery({
    queryKey: ['library', selectedOrganizationId, currentFolderId],
    queryFn: () => getLibraryContent(selectedOrganizationId!, currentFolderId),
    enabled: !!selectedOrganizationId,
    retry: (failureCount, error) => {
      // No retry for authentication/authorization errors
      if (error instanceof Error && 
          (error.message.includes('401') || 
           error.message.includes('403') ||
           error.message.includes('Unauthorized') ||
           error.message.includes('no tiene ningún rol') ||
           error.message.includes('access denied'))) {
        return false;
      }
      // Retry other errors up to 2 times (instead of default 3)
      return failureCount < 2;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const currentItems = libraryData?.content || [];

  // Create items with back button when in subfolder (memoized to avoid unnecessary re-renders)
  const treeItems = useMemo((): FileNode[] => {
    const filteredItems = getFilteredItems();
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
  }, [currentItems, searchTerm, breadcrumb]);

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
    try {
      console.log(`🔗 Sharing item: "${item.name}" (${item.type}) - ${isAutomatic ? 'AUTO' : 'MANUAL'}`);
      console.log(`📁 Current breadcrumb:`, breadcrumb.map(b => `${b.name}(${b.id})`));
      console.log(`🛤️  Item full path from component:`, fullPath);
      
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
        console.log(`🔄 Auto-updating ONLY browser URL for selected file: ${item.name}`);
        console.log(`🔄 Complete path from component:`, completePath);
        
        // Build the complete URL directly from the full path
        const completeUrl = `/asset/${completePath.join('/')}`;
        console.log(`🔄 Auto-corrected browser URL (URL only):`, completeUrl);
        
        // Only update the browser URL, DO NOT change breadcrumb or navigation state
        navigate(completeUrl, { replace: true });
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
        console.log(`✅ URL auto-generated: ${shareUrl}`);
      }
      
    } catch (error) {
      console.error('❌ Error in share handler:', error);
      if (!isAutomatic) {
        const { toast } = await import("sonner");
        toast.error('Failed to copy link to clipboard');
      }
    }
  };


  if (error) {
    // Check if it's a role/permission error vs other errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isPermissionError = errorMessage.includes('no tiene ningún rol') || 
                             errorMessage.includes('no permission') ||
                             errorMessage.includes('insufficient privileges') ||
                             errorMessage.includes('access denied');
    
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
    
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full">
            <File className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al Cargar Assets</h2>
          <p className="text-sm text-gray-600 mb-4">
            Ocurrió un problema al cargar el contenido. Por favor intenta de nuevo.
          </p>
          <p className="text-xs text-gray-500 mb-6">
            {errorMessage}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Trigger a refetch
              queryClient.invalidateQueries({ queryKey: ['library', selectedOrganizationId] });
            }}
            className="hover:cursor-pointer"
          >
            Intentar de Nuevo
          </Button>
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

  // Si no hay organización seleccionada, mostrar un placeholder
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
                <Tooltip>
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
                </Tooltip>

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
              {isLoading ? (
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
            refetchDocumentContent={refetchDocumentContent}
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
