"use client"

import { memo, useState } from "react"
import { Handle, Position, type NodeProps, type Node, ConnectionMode } from "@xyflow/react"
export { ConnectionMode }
import { Loader2, Network, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"

export interface AssetTypeNodeData {
  id: string
  documentTypeId?: string   // set in execution mode; id holds assetId in that case
  executionId?: string      // the selected execution for this asset node (execution mode)
  name: string
  color: string
  onLoadRelationships?: (documentTypeId: string) => Promise<void> | void
  onRemove?: (id: string) => void
  [key: string]: unknown
}

type AssetTypeNodeType = Node<AssetTypeNodeData, "assetType">

export function AssetTypeNode({ data, selected }: NodeProps<AssetTypeNodeType>) {
  const { t } = useTranslation("document-type-relationships")
  const [isLoading, setIsLoading] = useState(false)

  const nodeContent = (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-background shadow-md min-w-[140px] max-w-[200px]",
        "transition-shadow",
        selected ? "shadow-lg" : "shadow-sm",
      )}
      style={{ borderColor: data.color || "#94a3b8" }}
    >
      {/* Floating handles — source on all 4 sides so edges attach to nearest point */}
      <Handle type="source" position={Position.Top}    id="top"
        className="!w-3 !h-3 !border-2 !bg-background transition-colors hover:!bg-primary/20"
        style={{ borderColor: data.color || "#94a3b8" }}
      />
      <Handle type="source" position={Position.Right}  id="right"
        className="!w-3 !h-3 !border-2 !bg-background transition-colors hover:!bg-primary/20"
        style={{ borderColor: data.color || "#94a3b8" }}
      />
      <Handle type="source" position={Position.Bottom} id="bottom"
        className="!w-3 !h-3 !border-2 !bg-background transition-colors hover:!bg-primary/20"
        style={{ borderColor: data.color || "#94a3b8" }}
      />
      <Handle type="source" position={Position.Left}   id="left"
        className="!w-3 !h-3 !border-2 !bg-background transition-colors hover:!bg-primary/20"
        style={{ borderColor: data.color || "#94a3b8" }}
      />

      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <div
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: data.color || "#94a3b8" }}
          />
        )}
        <span className="text-xs font-semibold truncate">{data.name}</span>
      </div>
    </div>
  )

  if (!data.onLoadRelationships) {
    return nodeContent
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {nodeContent}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          className="hover:cursor-pointer"
          disabled={isLoading}
          onSelect={async () => {
            if (!data.onLoadRelationships || isLoading) return
            setIsLoading(true)
            try {
              await data.onLoadRelationships(data.id)
            } finally {
              setIsLoading(false)
            }
          }}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Network className="mr-2 h-4 w-4" />
          )}
          <span>{isLoading ? t("node.loadingRelationships") : t("node.loadRelationships")}</span>
        </ContextMenuItem>
        <ContextMenuItem
          className="hover:cursor-pointer text-destructive focus:text-destructive"
          onClick={() => data.onRemove?.(data.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>{t("node.removeFromCanvas")}</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export const MemoizedAssetTypeNode = memo(AssetTypeNode)
