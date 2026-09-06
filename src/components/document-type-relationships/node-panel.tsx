"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { X, Network, Loader2, AlertCircle, Maximize2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CanvasNodeAction } from "@/types/document-type-relationships"
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId"
import { useDocumentTypeRelationships } from "@/hooks/useDocumentTypeRelationships"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { Execution } from "@/types/execution"
import type { DocumentType } from "@/types/document-types"

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
  /** Modo execution con assetId real: abre el asset en pantalla completa (nueva pestaña). */
  onOpenAsset?: () => void
  onClose: () => void
  // Execution mode
  mode?: "document-type" | "execution"
  executionId?: string
  organizationId?: string
  onSelectExecution?: (nodeId: string, executionId: string, executionName: string) => void
  readOnly?: boolean
  /** Modo execution: id del tipo de activo del nodo — para listar tipos relacionados configurados. */
  documentTypeId?: string
  /** Catálogo completo de tipos de activo — resuelve nombre/color de los tipos relacionados. */
  documentTypes?: DocumentType[]
  /** Expande relaciones filtrando solo el tipo de activo relacionado elegido. */
  onLoadRelationshipsForType?: (nodeId: string, documentTypeId: string) => Promise<void> | void
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
  onOpenAsset,
  onClose,
  mode,
  executionId,
  organizationId,
  onSelectExecution,
  readOnly = false,
  documentTypeId,
  documentTypes,
  onLoadRelationshipsForType,
}: NodePanelProps) {
  const { t } = useTranslation("document-type-relationships")
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false)
  const [isLoadingRelationshipsCanvasOnly, setIsLoadingRelationshipsCanvasOnly] = useState(false)
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const [loadingTypeId, setLoadingTypeId] = useState<string | null>(null)

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

  // Tipos de activo relacionados configurados para el tipo de este nodo — para "Expandir por tipo".
  const { data: relSchema } = useDocumentTypeRelationships(organizationId ?? "", {
    documentTypeId,
    includeSubrelationships: false,
    enabled: isExecutionMode && !!organizationId && !!documentTypeId && !!onLoadRelationshipsForType,
  })

  const relatedTypeOptions = useMemo(() => {
    if (!documentTypeId) return []
    const seen = new Map<string, string>() // partnerId -> name
    for (const rel of relSchema?.data ?? []) {
      const partnerId = rel.source_document_type_id === documentTypeId ? rel.target_document_type_id : rel.source_document_type_id
      if (!seen.has(partnerId)) {
        seen.set(partnerId, documentTypes?.find((d) => d.id === partnerId)?.name ?? partnerId)
      }
    }
    return Array.from(seen, ([value, label]) => ({
      value,
      label,
      color: documentTypes?.find((d) => d.id === value)?.color,
    }))
  }, [relSchema, documentTypeId, documentTypes])

  const handleLoadRelationships = async () => {
    if (!onLoadRelationships || isLoadingRelationships) return
    setIsLoadingRelationships(true)
    try {
      await onLoadRelationships(nodeId)
    } finally {
      setIsLoadingRelationships(false)
    }
  }

  const handleLoadForType = async (partnerTypeId: string) => {
    if (!onLoadRelationshipsForType || loadingTypeId) return
    setLoadingTypeId(partnerTypeId)
    try {
      await onLoadRelationshipsForType(nodeId, partnerTypeId)
    } finally {
      setLoadingTypeId(null)
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

        {/* Version selector — execution mode only, hidden in read-only view */}
        {isExecutionMode && !readOnly && (
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

        {/* Actions — hidden entirely in read-only view when there's nothing to show */}
        {(onOpenAsset || onLoadRelationships || (onLoadRelationshipsForType && relatedTypeOptions.length > 0) || onLoadRelationshipsCanvasOnly || (nodeActions && nodeActions.length > 0)) && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            {t("nodePanel.actions")}
          </p>
          <div className="flex flex-col gap-1">
            {/* Open the asset behind this node in the dedicated fullscreen view (new tab) */}
            {onOpenAsset && (
              <button
                onClick={onOpenAsset}
                className={cn(
                  "flex items-start gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground",
                  "hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors",
                )}
              >
                <Maximize2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="text-xs font-medium">{t("nodePanel.openAsset")}</span>
              </button>
            )}
            {onOpenAsset && (onLoadRelationships || onLoadRelationshipsCanvasOnly) && (
              <div className="border-t my-1" />
            )}

            {/* Load relationships (recursively expands the canvas with related nodes) */}
            {onLoadRelationships && (
              <button
                onClick={handleLoadRelationships}
                disabled={isLoadingRelationships}
                className={cn(
                  "flex items-start gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground",
                  "hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isLoadingRelationships ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin mt-0.5" />
                ) : (
                  <Network className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                )}
                <span className="flex flex-col items-start text-left gap-0.5">
                  <span className="text-xs font-medium">
                    {isLoadingRelationships
                      ? t("nodePanel.loadingRelationships")
                      : t("nodePanel.loadRelationships")}
                  </span>
                  {!isLoadingRelationships && (
                    <span className="text-[11px] leading-snug text-muted-foreground/80 font-normal">
                      {t("nodePanel.loadRelationshipsDescription")}
                    </span>
                  )}
                </span>
              </button>
            )}

            {/* Expand relationships filtered to one related asset type */}
            {onLoadRelationshipsForType && relatedTypeOptions.length > 0 && (
              <div>
                <button
                  onClick={() => setIsTypeMenuOpen((v) => !v)}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground w-full",
                    "hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors",
                  )}
                >
                  <Network className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="flex flex-col items-start text-left gap-0.5 flex-1">
                    <span className="text-xs font-medium">{t("nodePanel.expandByType")}</span>
                    <span className="text-[11px] leading-snug text-muted-foreground/80 font-normal">
                      {t("nodePanel.expandByTypeDescription")}
                    </span>
                  </span>
                  <ChevronRight
                    className={cn("h-3.5 w-3.5 shrink-0 mt-0.5 transition-transform", isTypeMenuOpen && "rotate-90")}
                  />
                </button>
                {isTypeMenuOpen && (
                  <div className="flex flex-col gap-0.5 pl-6 mt-0.5">
                    {relatedTypeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleLoadForType(opt.value)}
                        disabled={!!loadingTypeId}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-muted-foreground",
                          "hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                        )}
                      >
                        {loadingTypeId === opt.value ? (
                          <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                        ) : (
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: opt.color || "#94a3b8" }}
                          />
                        )}
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Load canvas relationships (only connects nodes already on the canvas) */}
            {onLoadRelationshipsCanvasOnly && (
              <button
                onClick={handleLoadRelationshipsCanvasOnly}
                disabled={isLoadingRelationshipsCanvasOnly}
                className={cn(
                  "flex items-start gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground",
                  "hover:bg-accent hover:text-foreground hover:cursor-pointer transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isLoadingRelationshipsCanvasOnly ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin mt-0.5" />
                ) : (
                  <Network className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                )}
                <span className="flex flex-col items-start text-left gap-0.5">
                  <span className="text-xs font-medium">
                    {isLoadingRelationshipsCanvasOnly
                      ? t("nodePanel.loadingRelationships")
                      : t("nodePanel.loadRelationshipsCanvasOnly")}
                  </span>
                  {!isLoadingRelationshipsCanvasOnly && (
                    <span className="text-[11px] leading-snug text-muted-foreground/80 font-normal">
                      {t("nodePanel.loadRelationshipsCanvasOnlyDescription")}
                    </span>
                  )}
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
        )}
      </div>
    </div>
  )
}
