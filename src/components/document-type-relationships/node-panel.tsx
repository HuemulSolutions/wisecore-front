"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { X, Network, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CanvasNodeAction } from "@/types/document-type-relationships"
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { Execution } from "@/types/execution"

function executionLabel(ex: Execution): string {
  const ver =
    ex.version_major != null
      ? `v${ex.version_major}.${ex.version_minor ?? 0}.${ex.version_patch ?? 0}`
      : null
  const parts = [ex.name, ver].filter(Boolean)
  return parts.join(" — ")
}

interface NodePanelProps {
  nodeId: string
  /** In execution mode: the real asset/document ID (separate from the unique canvas node ID) */
  assetId?: string
  nodeName: string
  nodeColor: string
  /** In execution mode: the asset type name (separate from the asset name) */
  assetTypeName?: string
  nodeActions?: CanvasNodeAction[]
  onLoadRelationships?: (id: string) => Promise<void> | void
  onLoadRelationshipsCanvasOnly?: (id: string) => Promise<void> | void
  onClose: () => void
  // Execution mode
  mode?: "document-type" | "execution"
  executionId?: string
  organizationId?: string
  onSelectExecution?: (nodeId: string, executionId: string, executionName: string) => void
}

export function NodePanel({
  nodeId,
  assetId,
  nodeName,
  nodeColor,
  assetTypeName,
  nodeActions,
  onLoadRelationships,
  onLoadRelationshipsCanvasOnly,
  onClose,
  mode,
  executionId,
  organizationId,
  onSelectExecution,
}: NodePanelProps) {
  const { t } = useTranslation("document-type-relationships")
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false)
  const [isLoadingRelationshipsCanvasOnly, setIsLoadingRelationshipsCanvasOnly] = useState(false)

  const isExecutionMode = mode === "execution"

  const { data: executions, isLoading: isLoadingExecutions } = useExecutionsByDocumentId(
    assetId ?? nodeId,
    organizationId ?? "",
    isExecutionMode && !!organizationId,
  )

  const execOptions = ((executions as Execution[]) ?? []).map((ex) => ({
    label: executionLabel(ex),
    value: ex.id,
  }))

  const handleLoadRelationships = async () => {
    if (!onLoadRelationships || isLoadingRelationships) return
    setIsLoadingRelationships(true)
    try {
      await onLoadRelationships(nodeId)
    } finally {
      setIsLoadingRelationships(false)
    }
  }

  const handleLoadRelationshipsCanvasOnly = async () => {
    if (!onLoadRelationshipsCanvasOnly || isLoadingRelationshipsCanvasOnly) return
    setIsLoadingRelationshipsCanvasOnly(true)
    try {
      await onLoadRelationshipsCanvasOnly(nodeId)
    } finally {
      setIsLoadingRelationshipsCanvasOnly(false)
    }
  }

  return (
    <div className="w-72 shrink-0 flex flex-col border-l bg-background h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="h-3.5 w-3.5 rounded-full shrink-0"
            style={{ backgroundColor: nodeColor || "#94a3b8" }}
          />
          <span className="text-sm font-semibold truncate">{nodeName}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent hover:cursor-pointer text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-4 flex-1 overflow-auto">
        {/* Asset type info badge */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {t("nodePanel.assetType")}
          </p>
          <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
            {assetTypeName && (
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: nodeColor || "#94a3b8" }}
                />
                <span className="text-xs font-medium truncate">{assetTypeName}</span>
              </div>
            )}
            {!assetTypeName && (
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: nodeColor || "#94a3b8" }}
                />
                <span className="text-xs font-medium truncate">{nodeName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Version selector — execution mode only */}
        {isExecutionMode && (
          <div className="space-y-2">
            {isLoadingExecutions ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {t("nodePanel.version")}
                </p>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/10 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  <span>{t("nodePanel.loadingRelationships")}</span>
                </div>
              </div>
            ) : (
              <HuemulField
                type="select"
                label={t("nodePanel.version")}
                name="execution_version"
                value={executionId ?? ""}
                onChange={(v) => {
                  const label = execOptions.find((o) => o.value === v)?.label ?? ""
                  onSelectExecution?.(nodeId, v as string, label)
                }}
                options={execOptions}
                placeholder={t("relationship.selectExecution")}
                description={execOptions.length === 0 ? t("relationship.noExecutions") : undefined}
                disabled={execOptions.length === 0}
              />
            )}
            {!isLoadingExecutions && !executionId && execOptions.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <p className="text-[11px]">{t("nodePanel.versionRequired")}</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {t("nodePanel.actions")}
          </p>
          <div className="flex flex-col gap-1">
            {/* Load relationships */}
            {onLoadRelationships && (
              <button
                onClick={handleLoadRelationships}
                disabled={isLoadingRelationships}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground",
                  "hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isLoadingRelationships ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <Network className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>
                  {isLoadingRelationships
                    ? t("nodePanel.loadingRelationships")
                    : t("nodePanel.loadRelationships")}
                </span>
              </button>
            )}

            {/* Load canvas relationships (only between nodes already on canvas) */}
            {onLoadRelationshipsCanvasOnly && (
              <button
                onClick={handleLoadRelationshipsCanvasOnly}
                disabled={isLoadingRelationshipsCanvasOnly}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground",
                  "hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isLoadingRelationshipsCanvasOnly ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <Network className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>
                  {isLoadingRelationshipsCanvasOnly
                    ? t("nodePanel.loadingRelationships")
                    : t("nodePanel.loadRelationshipsCanvasOnly")}
                </span>
              </button>
            )}

            {/* Separator before custom actions */}
            {(onLoadRelationships || onLoadRelationshipsCanvasOnly) && nodeActions && nodeActions.length > 0 && (
              <div className="border-t my-1" />
            )}

            {/* Custom actions */}
            {nodeActions?.map((action) => {
              const Icon = action.icon
              return (
                <div key={action.key}>
                  {action.separator && <div className="border-t my-1" />}
                  <button
                    onClick={() => action.onClick(nodeId)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground w-full",
                      "hover:cursor-pointer transition-colors",
                      action.destructive
                        ? "hover:bg-destructive/10 hover:text-destructive"
                        : "hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{action.label}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
