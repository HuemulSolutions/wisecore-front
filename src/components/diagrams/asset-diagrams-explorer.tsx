"use client"

import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Panel,
  BackgroundVariant,
  type Node,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { ArrowLeft, RefreshCw, Workflow, AlertCircle, Plus } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useOrgPath } from "@/hooks/useOrgRouter"
import { useDiagrams } from "@/hooks/useDiagrams"
import { buildAssetDiagramsExplorerGraph } from "@/lib/diagram-utils"
import { MemoizedAssetTypeNode } from "@/components/document-type-relationships/asset-type-node"
import { MemoizedDiagramCardNode, type DiagramCardNodeData } from "./diagram-card-node"

const NODE_TYPES = {
  assetType: MemoizedAssetTypeNode,
  diagramCard: MemoizedDiagramCardNode,
}

export interface AssetDiagramsExplorerProps {
  organizationId: string
  assetId: string
  executionId: string
  assetName: string
  assetColor: string
  executionName?: string
  /** El diagrama que se está editando en el canvas de fondo, si lo hay — su nodo se
   * marca "actual" y no abre el visor al hacer clic. */
  currentDiagramId?: string
  /** Clic en un nodo-diagrama (no el actual) — el caller decide cómo mostrarlo
   * (normalmente `DiagramViewSheet`). Sin este callback, el explorador solo importaría
   * `DiagramViewSheet` → `DiagramCanvas` → `RelationshipsCanvas`, que es exactamente
   * el componente que monta este overlay: import circular. */
  onOpenDiagram: (diagramId: string) => void
  onClose: () => void
}

/**
 * Overlay que cubre el canvas de diagramas en edición (sin desmontarlo — sigue montado
 * debajo, `nodes`/`edges` intactos) mostrando el activo+versión de un nodo al centro y,
 * alrededor, un nodo por cada diagrama asignado a esa versión (`execution_id` exacto,
 * no cualquier diagrama que solo la referencie como detalle). Clic en un nodo delega
 * en `onOpenDiagram` — normalmente el caller monta el visor read-only ya existente
 * (`DiagramViewSheet`).
 */
export function AssetDiagramsExplorer({
  organizationId,
  assetId,
  executionId,
  assetName,
  assetColor,
  executionName,
  currentDiagramId,
  onOpenDiagram,
  onClose,
}: AssetDiagramsExplorerProps) {
  const { t } = useTranslation("diagrams")
  const buildPath = useOrgPath()
  const { isOrgAdmin, hasPermission } = useUserPermissions()

  const { data, isLoading, isError, isFetching, refetch } = useDiagrams(organizationId, {
    executionId,
    pageSize: 100,
  })

  // El backend matchea `execution_id` contra el diagrama O contra cualquiera de sus
  // detalles (ver types/diagrams.ts) — acá solo interesan los diagramas ASIGNADOS a
  // esta versión, así que se filtra en el front por el campo exacto.
  const diagrams = useMemo(
    () => (data?.data ?? []).filter((d) => d.execution_id === executionId),
    [data, executionId],
  )

  const canCreate = isOrgAdmin || hasPermission("diagram:c")

  const handleCreate = () => {
    const params = new URLSearchParams({ diagram: "new", seedAsset: assetId, seedExecution: executionId })
    window.open(buildPath(`/diagrams?${params}`), "_blank", "noopener,noreferrer")
  }

  const graph = useMemo(
    () =>
      buildAssetDiagramsExplorerGraph(
        { assetId, executionId, name: assetName, color: assetColor, executionName },
        diagrams,
        currentDiagramId,
      ),
    [assetId, executionId, assetName, assetColor, executionName, diagrams, currentDiagramId],
  )

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type !== "diagramCard") return
    const data = node.data as DiagramCardNodeData
    if (data.isCurrent) return
    onOpenDiagram(node.id)
  }, [onOpenDiagram])

  return (
    <div className="absolute inset-0 z-(--z-canvas-overlay) bg-background">
      <ReactFlowProvider>
        <ReactFlow
          nodes={graph.nodes}
          edges={graph.edges}
          onNodeClick={handleNodeClick}
          nodeTypes={NODE_TYPES}
          nodesDraggable={false}
          nodesConnectable={false}
          fitView
          proOptions={{ hideAttribution: true }}
          className="h-full w-full bg-muted/10"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls showInteractive={false} />

          <Panel position="top-left">
            <div className="flex items-center gap-3 bg-background/95 backdrop-blur border rounded-lg px-3 py-2 shadow-sm max-w-xs">
              <HuemulButton
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                icon={ArrowLeft}
                tooltip={t("explorer.back")}
                onClick={onClose}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold truncate">{t("explorer.title")}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {executionName ? t("explorer.subtitle", { asset: assetName, execution: executionName }) : assetName}
                </span>
              </div>
            </div>
          </Panel>

          <Panel position="top-right">
            <div className="flex items-center gap-2 bg-background/95 backdrop-blur border rounded-lg px-2 py-1.5 shadow-sm">
              <span className="text-xs text-muted-foreground px-1">
                {t("explorer.diagramsCount", { count: diagrams.length })}
              </span>
              <HuemulButton
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                icon={RefreshCw}
                tooltip={t("common:refresh")}
                loading={isFetching}
                onClick={() => refetch()}
              />
            </div>
          </Panel>

          {!isLoading && isError && (
            <Panel position="top-center">
              <div className="mt-24 flex flex-col items-center gap-2 p-6 bg-background/90 backdrop-blur rounded-xl border border-dashed text-center">
                <AlertCircle className="h-6 w-6 text-destructive/70" />
                <p className="text-sm text-muted-foreground">{t("explorer.loadingError")}</p>
              </div>
            </Panel>
          )}

          {!isLoading && !isError && diagrams.length === 0 && (
            <Panel position="top-center">
              <div className="mt-24 flex flex-col items-center gap-3 p-8 bg-background/90 backdrop-blur rounded-xl border border-dashed text-center">
                <Workflow className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t("explorer.empty")}</p>
                {canCreate && (
                  <HuemulButton size="sm" icon={Plus} onClick={handleCreate}>
                    {t("explorer.createAction")}
                  </HuemulButton>
                )}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </ReactFlowProvider>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
      )}
    </div>
  )
}
