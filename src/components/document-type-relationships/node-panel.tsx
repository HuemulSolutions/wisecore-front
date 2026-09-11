"use client"

import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { X, Network, Loader2, AlertCircle, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CanvasNodeAction } from "@/types/document-type-relationships"
import { useExecutionsByDocumentId } from "@/hooks/useExecutionsByDocumentId"
import { useExecutionRelationships } from "@/hooks/useExecutionRelationships"
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
  documentTypes,
  onLoadRelationshipsForType,
}: NodePanelProps) {
  const { t } = useTranslation("document-type-relationships")
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false)
  const [isLoadingRelationshipsCanvasOnly, setIsLoadingRelationshipsCanvasOnly] = useState(false)
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

  // Relaciones directas reales de esta versión — misma consulta que usa "Expandir
  // por tipo" al hacer clic, así el conteo mostrado siempre coincide con lo que se
  // va a agregar al canvas.
  const { data: relatedData, isLoading: isLoadingRelatedTypes } = useExecutionRelationships(
    organizationId ?? "",
    executionId ?? "",
    {
      pageSize: 1000,
      includeSubrelationships: false,
      enabled: isExecutionMode && !!organizationId && !!executionId && !!onLoadRelationshipsForType,
    },
  )

  const relatedTypeOptions = useMemo(() => {
    if (!executionId) return []
    const grouped = new Map<string, { count: number; color?: string }>()
    for (const rel of relatedData?.data ?? []) {
      const other = rel.source_execution.id === executionId ? rel.target_execution : rel.source_execution
      const entry = grouped.get(other.document_type_id) ?? { count: 0, color: other.document_type_color }
      entry.count += 1
      if (!entry.color && other.document_type_color) entry.color = other.document_type_color
      grouped.set(other.document_type_id, entry)
    }
    return Array.from(grouped, ([value, { count, color }]) => ({
      value,
      label: documentTypes?.find((d) => d.id === value)?.name ?? value,
      color: color ?? documentTypes?.find((d) => d.id === value)?.color,
      count,
    })).sort((a, b) => b.count - a.count)
  }, [relatedData, executionId, documentTypes])

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

        {/* Related asset types — relaciones directas reales de esta versión, con
            conteo; clic expande al canvas solo los activos de ese tipo. Siempre
            visible (sin acordeón) cuando hay una versión seleccionada. */}
        {onLoadRelationshipsForType && executionId && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              {t("nodePanel.relatedTypes")}
            </p>
            {isLoadingRelatedTypes ? (
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/10 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                <span>{t("nodePanel.relatedTypesLoading")}</span>
              </div>
            ) : relatedTypeOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("nodePanel.relatedTypesEmpty")}</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {relatedTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleLoadForType(opt.value)}
                    disabled={!!loadingTypeId}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-muted-foreground w-full",
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
                    <span className="truncate flex-1 text-left">{opt.label}</span>
                    <span className="text-[10px] font-medium text-muted-foreground/70 bg-muted rounded-full px-1.5 py-0.5 shrink-0">
                      {opt.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions — hidden entirely in read-only view when there's nothing to show */}
        {(onOpenAsset || onLoadRelationships || onLoadRelationshipsCanvasOnly || (nodeActions && nodeActions.length > 0)) && (
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
