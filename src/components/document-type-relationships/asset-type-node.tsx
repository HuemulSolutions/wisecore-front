"use client"

import { memo, useState } from "react"
import { Handle, Position, type NodeProps, type Node, ConnectionMode } from "@xyflow/react"
export { ConnectionMode }
import { Loader2, Network, Trash2, AlertCircle } from "lucide-react"
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
  assetId?: string          // actual document ID in execution mode (id is a unique canvas node ID)
  documentTypeId?: string   // set in execution mode
  executionId?: string      // the selected execution for this asset node (execution mode)
  executionName?: string    // display label of the selected execution
  name: string
  color: string
  onLoadRelationships?: (documentTypeId: string) => Promise<void> | void
  onLoadRelationshipsCanvasOnly?: (documentTypeId: string) => Promise<void> | void
  onRemove?: (id: string) => void
  // View-only mode: hides the context menu. Connection handles stay mounted
  // (just invisible/inert) — ReactFlow needs their handleBounds to position
  // edges; unmounting them breaks edge rendering entirely (error 008).
  readOnly?: boolean
  [key: string]: unknown
}

type AssetTypeNodeType = Node<AssetTypeNodeData, "assetType">

const handleClass = "!w-3 !h-3 !border-2 !bg-background transition-colors hover:!bg-primary/20"
const handleReadOnlyClass = "!opacity-0 !pointer-events-none"

export function AssetTypeNode({ data, selected }: NodeProps<AssetTypeNodeType>) {
  const { t } = useTranslation("document-type-relationships")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCanvasOnly, setIsLoadingCanvasOnly] = useState(false)

  // In execution mode (documentTypeId is set) warn when no version is selected yet
  const needsVersion = !!data.documentTypeId && !data.executionId

  const nodeContent = (
    <div
      className={cn(
        "relative px-4 py-3 rounded-xl border-2 bg-background shadow-md min-w-35 max-w-50",
        "transition-shadow",
        selected ? "shadow-lg" : "shadow-sm",
        needsVersion ? "border-amber-400" : "",
      )}
      style={needsVersion ? undefined : { borderColor: data.color || "#94a3b8" }}
    >
      {needsVersion && (
        <div className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center">
          <AlertCircle className="h-2.5 w-2.5 text-white" />
        </div>
      )}
      {/* Floating handles — source on all 4 sides so edges attach to nearest point.
          Always mounted, even in readOnly: ReactFlow only computes handleBounds
          from handles present in the DOM, and edges need those bounds to be
          positioned at all. In readOnly they're just made invisible/inert. */}
      <Handle type="source" position={Position.Top}    id="top"    isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)}
        style={{ borderColor: data.color || "#94a3b8" }}
      />
      <Handle type="source" position={Position.Right}  id="right"  isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)}
        style={{ borderColor: data.color || "#94a3b8" }}
      />
      <Handle type="source" position={Position.Bottom} id="bottom" isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)}
        style={{ borderColor: data.color || "#94a3b8" }}
      />
      <Handle type="source" position={Position.Left}   id="left"   isConnectable={!data.readOnly}
        className={cn(handleClass, data.readOnly && handleReadOnlyClass)}
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
      {data.executionId && data.executionName && (
        <p className="text-[10px] text-muted-foreground mt-1 truncate" title={data.executionName}>
          {data.executionName}
        </p>
      )}
      {needsVersion && (
        <p className="text-[10px] text-amber-500 mt-1 leading-tight">
          {t("nodePanel.versionRequired")}
        </p>
      )}
    </div>
  )

  if (data.readOnly || (!data.onLoadRelationships && !data.onLoadRelationshipsCanvasOnly)) {
    return nodeContent
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {nodeContent}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {data.onLoadRelationships && (
          <ContextMenuItem
            className="items-start hover:cursor-pointer"
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
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin mt-0.5" />
            ) : (
              <Network className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{isLoading ? t("nodePanel.loadingRelationships") : t("nodePanel.loadRelationships")}</span>
              {!isLoading && (
                <span className="text-[11px] leading-snug text-muted-foreground/80 font-normal whitespace-normal">
                  {t("nodePanel.loadRelationshipsDescription")}
                </span>
              )}
            </span>
          </ContextMenuItem>
        )}
        {data.onLoadRelationshipsCanvasOnly && (
          <ContextMenuItem
            className="items-start hover:cursor-pointer"
            disabled={isLoadingCanvasOnly}
            onSelect={async () => {
              if (!data.onLoadRelationshipsCanvasOnly || isLoadingCanvasOnly) return
              setIsLoadingCanvasOnly(true)
              try {
                await data.onLoadRelationshipsCanvasOnly(data.id)
              } finally {
                setIsLoadingCanvasOnly(false)
              }
            }}
          >
            {isLoadingCanvasOnly ? (
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin mt-0.5" />
            ) : (
              <Network className="mr-2 h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">{isLoadingCanvasOnly ? t("nodePanel.loadingRelationships") : t("nodePanel.loadRelationshipsCanvasOnly")}</span>
              {!isLoadingCanvasOnly && (
                <span className="text-[11px] leading-snug text-muted-foreground/80 font-normal whitespace-normal">
                  {t("nodePanel.loadRelationshipsCanvasOnlyDescription")}
                </span>
              )}
            </span>
          </ContextMenuItem>
        )}
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
