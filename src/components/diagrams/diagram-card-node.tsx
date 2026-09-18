"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { Workflow } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn, formatApiDateTime } from "@/lib/utils"

export interface DiagramCardNodeData {
  id: string
  name: string
  createdAt: string
  detailsCount: number
  /** El diagrama que se está editando actualmente en el canvas de fondo — se marca
   * distinto y no abre el sheet (ya se está viendo/editando). */
  isCurrent?: boolean
  [key: string]: unknown
}

type DiagramCardNodeType = Node<DiagramCardNodeData, "diagramCard">

// Nodo del overlay AssetDiagramsExplorer — uno por diagrama asignado a la versión
// explorada. El click lo maneja el `onNodeClick` de AssetDiagramsExplorer (mismo
// patrón centralizado que relationships-canvas.tsx), no un handler propio. Sin handles
// de source (nunca es origen de una conexión), solo un target invisible: React Flow
// necesita el handle montado en el DOM para posicionar el edge que lo une al nodo
// central (mismo motivo que asset-type-node.tsx:62-65).
export function DiagramCardNode({ data, selected }: NodeProps<DiagramCardNodeType>) {
  const { t } = useTranslation("diagrams")

  return (
    <div
      title={data.name}
      className={cn(
        "flex flex-col gap-1 px-3 py-2 rounded-xl border-2 bg-background shadow-sm min-w-40 max-w-56",
        "transition-shadow",
        data.isCurrent ? "border-primary/50 cursor-default" : "border-muted-foreground/20 hover:shadow-md hover:cursor-pointer",
        selected ? "shadow-lg" : "",
      )}
    >
      <Handle type="target" position={Position.Top} isConnectable={false} className="!opacity-0 !pointer-events-none" />
      <div className="flex items-center gap-2 min-w-0">
        <Workflow className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-xs font-semibold truncate">{data.name}</span>
        {data.isCurrent && (
          <span className="text-[10px] font-medium text-primary shrink-0 ml-auto">{t("explorer.currentBadge")}</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 min-w-0 text-[10px] text-muted-foreground">
        <span className="truncate">{formatApiDateTime(data.createdAt)}</span>
        <span className="shrink-0">{t("explorer.nodesCount", { count: data.detailsCount })}</span>
      </div>
    </div>
  )
}

export const MemoizedDiagramCardNode = memo(DiagramCardNode)
