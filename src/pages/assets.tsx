import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLibraryContent } from "@/services/folders";
import { AssetContent } from "@/components/assets";
import { EmptyState } from "@/components/assets/empty-state";
import { LoadingOverlay } from "@/components/assets/loading-overlay";
import { useOrganization } from "@/contexts/organization-context";
import { ExpandedFoldersProvider } from "@/hooks/use-expanded-folders";
import { useAssetNavigation } from "@/hooks/useAssetNavigation";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { NavKnowledgeProvider, NavKnowledgeHeader, NavKnowledgeContent } from "@/components/layout/nav-knowledge";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

/**
 * Main content component for the Assets page
 * Handles document navigation, URL management, and scroll preservation
 */
function AssetsContent() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId, organizationToken, resetOrganizationContext } = useOrganization();

  // Asset navigation (URL parsing, breadcrumb, selected file)
  const {
    breadcrumb,
    selectedFile,
    selectedExecutionId,
    isLoadingDocument,
    setSelectedFile,
    setSelectedExecutionId,
    currentFolderId,
  } = useAssetNavigation({ selectedOrganizationId, organizationToken });

  // Scroll preservation
  const { scrollContainerRef, preserveScroll, restoreScrollPosition } = useScrollPreservation();

  // Restore scroll after content updates
  useEffect(() => {
    const timeoutId = setTimeout(restoreScrollPosition, 50);
    return () => clearTimeout(timeoutId);
  }, [restoreScrollPosition, selectedFile, selectedExecutionId]);

  // Fetch library content for current folder
  const { error } = useQuery({
    queryKey: ['library', selectedOrganizationId, currentFolderId],
    queryFn: () => getLibraryContent(selectedOrganizationId!, currentFolderId),
    enabled: !!selectedOrganizationId && !!organizationToken,
    staleTime: 30000,
    gcTime: 300000,
    retry: false,
  });

  // Handle refresh library content
  const handleRefresh = async () => {
    queryClient.invalidateQueries({ queryKey: ['library', selectedOrganizationId] });
  };

  // Check for permission errors
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const isPermissionError = errorMessage.includes('no tiene ningún rol') || 
                           errorMessage.includes('no permission') ||
                           errorMessage.includes('insufficient privileges') ||
                           errorMessage.includes('access denied');

  // Empty states
  if (!selectedOrganizationId) {
    return <EmptyState type="no-organization" />;
  }

  if (isPermissionError) {
    return (
      <EmptyState 
        type="permission-error" 
        onChangeOrganization={resetOrganizationContext}
      />
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {isLoadingDocument && <LoadingOverlay />}
      
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={15} minSize={15} maxSize={25}>
          <div className="flex flex-col h-full bg-white border-r">
            <div className="py-2">
              <NavKnowledgeHeader />
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavKnowledgeContent />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        <ResizablePanel defaultSize={80} maxSize={90} minSize={70}>
          <div ref={scrollContainerRef} className="h-full bg-white">
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
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// Componente envoltorio que provee el contexto de carpetas expandidas
export default function Assets() {
  return (
    <NavKnowledgeProvider>
      <ExpandedFoldersProvider>
        <AssetsContent />
      </ExpandedFoldersProvider>
    </NavKnowledgeProvider>
  );
}
