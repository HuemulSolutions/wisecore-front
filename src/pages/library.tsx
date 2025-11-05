import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { File } from "lucide-react"; 
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLibraryContent } from "@/services/library";
import { getDocumentContent } from "@/services/documents";
import { LibrarySidebar } from "@/components/library/library-sidebar";
import { LibraryContent } from "@/components/library/library-content";
import { useOrganization } from "@/contexts/organization-context";

// API response interface
interface LibraryItem {
  id: string;
  name: string;
  type: "folder" | "document";
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

export default function Library() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<LibraryItem | null>(null);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const { selectedOrganizationId } = useOrganization();
  const hasRestoredRef = useRef(false);

  // Restaurar estado al montar (independiente de location.state)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    const savedBreadcrumb = sessionStorage.getItem('library-breadcrumb');
    const savedSelectedFile = sessionStorage.getItem('library-selectedFile');
    if (savedBreadcrumb) {
      try {
        const parsed = JSON.parse(savedBreadcrumb);
        if (Array.isArray(parsed) && parsed.length > 0) setBreadcrumb(parsed);
      } catch {}
    }
    if (savedSelectedFile) {
      try {
        const parsedFile = JSON.parse(savedSelectedFile);
        if (parsedFile?.id) setSelectedFile(parsedFile);
      } catch {}
    }
    hasRestoredRef.current = true;
  }, []);

  // Persistir breadcrumb en cada cambio
  useEffect(() => {
    sessionStorage.setItem('library-breadcrumb', JSON.stringify(breadcrumb));
  }, [breadcrumb]);

  // Persistir / limpiar archivo seleccionado
  useEffect(() => {
    if (selectedFile) {
      sessionStorage.setItem('library-selectedFile', JSON.stringify(selectedFile));
    } else {
      sessionStorage.removeItem('library-selectedFile');
    }
  }, [selectedFile]);

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
    queryFn: () => getDocumentContent(selectedFile!.id, selectedExecutionId || undefined),
    enabled: selectedFile?.type === 'document' && !!selectedFile?.id,
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
    queryKey: ['library', currentFolderId],
    queryFn: () => getLibraryContent(selectedOrganizationId!, currentFolderId),
    enabled: !!selectedOrganizationId,
  });

  const currentItems = libraryData?.content || [];

  // Handle refresh library content
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['library', currentFolderId] });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500 bg-gray-50">
        <div className="text-center">
          <File className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Error loading library content</p>
          <p className="text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <LibrarySidebar
        breadcrumb={breadcrumb}
        setBreadcrumb={setBreadcrumb}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        currentItems={currentItems}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        <div className="flex-1 overflow-auto bg-white">
          <LibraryContent
            selectedFile={selectedFile}
            breadcrumb={breadcrumb}
            selectedExecutionId={selectedExecutionId}
            setSelectedExecutionId={setSelectedExecutionId}
            refetchDocumentContent={refetchDocumentContent}
            setSelectedFile={setSelectedFile}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
      
    </div>
  );
}
