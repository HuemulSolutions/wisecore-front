"use client"

import { useTranslation } from "react-i18next"
import { X, ArrowRight, Edit2, Trash2, Settings2, GitMerge } from "lucide-react"
import { type Edge, type Node } from "@xyflow/react"
import { Badge } from "@/components/ui/badge"
import type { AssetTypeNodeData } from "./asset-type-node"
import type { RelationshipEdgeData } from "./relationship-edge"

interface RelationshipPanelProps {
  selectedEdgeId: string
  canvasNodes: Node<AssetTypeNodeData>[]
  edges: Edge<RelationshipEdgeData>[]
  onClose: () => void
}

export function RelationshipPanel({
  selectedEdgeId,
  canvasNodes,
  edges,
  onClose,
}: RelationshipPanelProps) {
  const { t } = useTranslation("document-type-relationships")

  const edge = edges.find((e) => e.id === selectedEdgeId)
  if (!edge) return null

  const edgeData = edge.data!
  const sourceNode = canvasNodes.find((n) => n.id === edge.source)
  const targetNode = canvasNodes.find((n) => n.id === edge.target)

  return (
    <div className="w-72 shrink-0 flex flex-col border-l bg-background h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <GitMerge className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold truncate">{edgeData.name}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Relationship details */}
      <div className="px-4 py-4 space-y-4 flex-1 overflow-auto">
        {/* Source → Target */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {t("panel.connection")}
          </p>
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-2 min-w-0">
              {sourceNode && (
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: sourceNode.data.color || "#94a3b8" }}
                />
              )}
              <span className="text-xs font-medium truncate flex-1">
                {sourceNode?.data.name ?? edge.source}
              </span>
            </div>
            <div className="flex items-center gap-2 pl-1">
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              {targetNode && (
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: targetNode.data.color || "#94a3b8" }}
                />
              )}
              <span className="text-xs font-medium truncate flex-1">
                {targetNode?.data.name ?? edge.target}
              </span>
            </div>
          </div>
        </div>

        {/* Cardinality */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {t("panel.cardinality")}
          </p>
          <Badge variant="outline" className="text-xs h-6 px-2">
            {edgeData.minCount}–{edgeData.maxCount === 0 ? "∞" : edgeData.maxCount}
          </Badge>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {t("panel.actions")}
          </p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => edgeData.onEdit(edgeData.relationshipId)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5 shrink-0" />
              <span>{t("panel.edit")}</span>
            </button>
            <button
              onClick={() => edgeData.onManageAttributes(edgeData.relationshipId)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5 shrink-0" />
              <span>{t("panel.attributes")}</span>
            </button>
            <button
              onClick={() => edgeData.onDelete(edgeData.relationshipId)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:cursor-pointer transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span>{t("panel.delete")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
