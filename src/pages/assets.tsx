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
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex min-w-0 h-full relative">
        {isLoadingDocument && <LoadingOverlay />}
        
        <div ref={scrollContainerRef} className="flex-1 bg-white min-w-0 h-full">
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
