import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AssetContent } from "@/components/assets";
import { AssetEmptyContent } from "@/components/assets/content/assets-empty-content";
import { EmptyState } from "@/components/assets/empty-state";
import { LoadingOverlay } from "@/components/assets/loading-overlay";
import { useOrganization } from "@/contexts/organization-context";
import { ExpandedFoldersProvider } from "@/hooks/use-expanded-folders";
import { useAssetNavigation } from "@/hooks/useAssetNavigation";
import { useScrollPreservation } from "@/hooks/useScrollPreservation";
import { NavKnowledgeHeader, NavKnowledgeContent } from "@/components/layout/nav-knowledge";
import { useNavKnowledgeRefresh, useNavKnowledgePagination, useNavKnowledgeMode } from "@/contexts/nav-knowledge-context";
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout";
import { HuemulPagination } from "@/huemul/components/huemul-pagination";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGlobalPanel } from "@/contexts/global-panel-context";
import { RelationshipsCanvas } from "@/components/document-type-relationships";
import { DiagramCanvas, NewDiagramCanvas } from "@/components/diagrams";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";

/**
 * Main content component for the Assets page
 * Handles document navigation, URL management, and scroll preservation
 */
function AssetsContent() {
  const queryClient = useQueryClient();
  const { selectedOrganizationId, organizationToken } = useOrganization();
  const refreshFileTree = useNavKnowledgeRefresh();
  const { isOpen: isWisyOpen } = useGlobalPanel();
  const { isRelationsMode, setIsRelationsMode } = useNavKnowledgeMode();
  const { data: docTypesResponse } = useDocumentTypes();
  const documentTypes = docTypesResponse?.data ?? [];
  const { page, pageSize, hasNext, hasPrevious, setPage } = useNavKnowledgePagination();

  // Deep-link into an existing diagram: /asset?diagram=<id> forces relations mode
  // on so the diagram opens in-place (with the asset tree available to edit it).
  // /asset?diagram=new does the same but opens a blank canvas to create one
  // (optionally seeded via ?seedAsset=&seedExecution=, see AssetDiagramsSheet).
  // Turning relations mode back off (checkbox in the tree kebab) drops the param.
  const [searchParams, setSearchParams] = useSearchParams();
  const diagramParam = searchParams.get('diagram');
  const isNewDiagram = diagramParam === 'new';
  const diagramId = isNewDiagram ? null : diagramParam;
  // seedAsset/seedExecution only matter on the very first render of the "new
  // diagram" deep link — useAssetNavigation's URL rewrites drop unknown query
  // params, so this is captured once instead of re-read from searchParams.
  const [diagramSeed] = useState(() => ({
    assetId: searchParams.get('seedAsset') ?? undefined,
    executionId: searchParams.get('seedExecution') ?? undefined,
  }));
  const wasRelationsModeRef = useRef(isRelationsMode);
  useEffect(() => {
    const wasOn = wasRelationsModeRef.current;
    wasRelationsModeRef.current = isRelationsMode;
    if (!diagramParam) return;
    if (!isRelationsMode) {
      if (wasOn) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('diagram');
          return next;
        }, { replace: true });
      } else {
        setIsRelationsMode(true);
      }
    }
  }, [diagramParam, isRelationsMode, setIsRelationsMode, setSearchParams]);

  // Asset navigation (URL parsing, breadcrumb, selected file)
  const {
    breadcrumb,
    selectedFile,
    selectedExecutionId,
    selectedSectionId,
    isLoadingDocument,
    setSelectedFile,
    setSelectedExecutionId,
    setSelectedSectionId,
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
    <div className="relative h-full">
      {isLoadingDocument && <LoadingOverlay />}
      <HuemulPageLayout
        className="bg-gray-50"
        columns={[
          {
            content: (
              <div className="flex flex-col h-full bg-white border-r">
                <div className="py-2">
                  <NavKnowledgeHeader />
                </div>
                <ScrollArea className="flex-1 min-h-0" type="hover">
                  <NavKnowledgeContent />
                </ScrollArea>
              </div>
            ),
            defaultSize: isWisyOpen ? 15 : 20,
            minSize: isWisyOpen ? 10 : 12,
            collapsible: true,
            collapsedSize: 0,
            className: "overflow-hidden [scrollbar-gutter:auto]",
            footer: {
              content: (
                <HuemulPagination
                  page={page}
                  pageSize={pageSize}
                  hasNext={hasNext}
                  hasPrevious={hasPrevious}
                  onPageChange={setPage}
                />
              ),
            },
          },
          {
            content: (
              <div ref={scrollContainerRef} className="h-full bg-white">
                {isRelationsMode && diagramId ? (
                  <DiagramCanvas
                    key={diagramId}
                    organizationId={selectedOrganizationId}
                    diagramId={diagramId}
                  />
                ) : isRelationsMode && isNewDiagram ? (
                  <NewDiagramCanvas
                    organizationId={selectedOrganizationId}
                    seedAssetId={diagramSeed.assetId}
                    seedExecutionId={diagramSeed.executionId}
                  />
                ) : isRelationsMode ? (
                  <RelationshipsCanvas
                    organizationId={selectedOrganizationId}
                    documentTypes={documentTypes}
                    mode="execution"
                  />
                ) : selectedFile ? (
                  <AssetContent
                    selectedFile={selectedFile}
                    breadcrumb={breadcrumb}
                    selectedExecutionId={selectedExecutionId}
                    setSelectedExecutionId={setSelectedExecutionId}
                    selectedSectionId={selectedSectionId}
                    setSelectedSectionId={setSelectedSectionId}
                    setSelectedFile={setSelectedFile}
                    onRefresh={handleRefresh}
                    currentFolderId={currentFolderId}
                    isSidebarOpen={false}
                    onToggleSidebar={() => {}}
                    onPreserveScroll={preserveScroll}
                  />
                ) : (
                  <AssetEmptyContent
                    currentFolderId={currentFolderId}
                    onPreserveScroll={preserveScroll}
                  />
                )}
              </div>
            ),
            defaultSize: 80,
            minSize: 50,
          },
        ]}
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
