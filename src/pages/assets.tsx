import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AssetContent } from "@/components/assets";
import { EmptyState } from "@/components/assets/empty-state";
import { LoadingOverlay } from "@/components/assets/loading-overlay";
import { useOrganization } from "@/contexts/organization-context";
import { ExpandedFoldersProvider } from "@/hooks/use-expanded-folders";
import { useAssetNavigation } from "@/hooks/useAssetNavigation";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { NavKnowledgeHeader, NavKnowledgeContent, useNavKnowledgeRefresh } from "@/components/layout/nav-knowledge";
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
  const { selectedOrganizationId, organizationToken } = useOrganization();
  const refreshFileTree = useNavKnowledgeRefresh();

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

  // Handle refresh library content
  const handleRefresh = async () => {
    queryClient.invalidateQueries({ queryKey: ['library', selectedOrganizationId] });
    refreshFileTree();
  };

  // Empty states
  if (!selectedOrganizationId) {
    return <EmptyState type="no-organization" />;
  }

  return (
    <div className="flex h-full bg-gray-50">
      {isLoadingDocument && <LoadingOverlay />}
      
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={20}>
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
        
        <ResizablePanel defaultSize={80} minSize={50}>
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
    <ExpandedFoldersProvider>
      <AssetsContent />
    </ExpandedFoldersProvider>
  );
}
