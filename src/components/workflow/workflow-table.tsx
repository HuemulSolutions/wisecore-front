import { useTranslation } from "react-i18next"
import { Workflow as WorkflowIcon, Trash2, Share2, Paperclip, Edit3, ExternalLink, Maximize2 } from "lucide-react"
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableAction, HuemulTableColumn, HuemulTablePagination } from "@/huemul/components/huemul-table"
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { lifecycleStageColor } from "@/lib/lifecycle-colors"
import type { WorkflowItem } from "@/types/workflow"
import { WorkflowProgressBar } from "./workflow-progress-bar"

interface WorkflowTableProps {
  data: WorkflowItem[]
  isLoading?: boolean
  isFetching?: boolean
  error?: Error | null
  onRetry?: () => void
  selectedExecutionId?: string | null
  onSelectRow: (item: WorkflowItem) => void
  pagination: HuemulTablePagination
  /** `asset:d` — DELETE /documents/{id}. Obligatoria (sin default) para que un
   * call-site futuro no herede un default permisivo. */
  canDelete: boolean
  onDelete: (item: WorkflowItem) => void
  /** Abre el diálogo con el link para responder esta ejecución. Quien ve la fila puede compartirla. */
  onShare: (item: WorkflowItem) => void
  /** `media:l|r` — misma paridad que el botón Paperclip del panel de detalle. */
  canViewMedia: boolean
  onViewMedia: (item: WorkflowItem) => void
  /** `asset:u` — misma paridad que el lápiz de editar nombre/código del panel de detalle. */
  canEditAsset: boolean
  onEditAsset: (item: WorkflowItem) => void
  /** `asset:r|l` — abre la misma ejecución en /asset (paridad con el ícono del header del panel). */
  canOpenAsset: boolean
  onOpenAsset: (item: WorkflowItem) => void
  /** `asset:r|l` — abre la vista a pantalla completa de la ejecución (misma ruta que el link compartido). */
  canOpenFullscreen: boolean
  onOpenFullscreen: (item: WorkflowItem) => void
  /** Hay búsqueda o filtros activos: cambia el empty state de "sin datos" a "sin resultados". */
  hasActiveFilters?: boolean
}

export function WorkflowTable({
  data,
  isLoading,
  isFetching,
  error,
  onRetry,
  selectedExecutionId,
  onSelectRow,
  pagination,
  canDelete,
  onDelete,
  onShare,
  canViewMedia,
  onViewMedia,
  canEditAsset,
  onEditAsset,
  canOpenAsset,
  onOpenAsset,
  canOpenFullscreen,
  onOpenFullscreen,
  hasActiveFilters,
}: WorkflowTableProps) {
  const { t } = useTranslation(["workflow", "common", "assets"])

  const columns: HuemulTableColumn<WorkflowItem>[] = [
    {
      key: "internalCode",
      label: t("columns.internalCode"),
      width: "minmax(110px,0.6fr)",
      render: (item) => (
        <span className="block max-w-35 truncate font-mono text-xs" title={item.internal_code}>
          {item.internal_code}
        </span>
      ),
    },
    {
      key: "documentName",
      label: t("columns.documentName"),
      width: "minmax(200px,1.3fr)",
      render: (item) => (
        <span className="block max-w-sm truncate" title={item.document_name}>
          {item.document_name}
        </span>
      ),
    },
    {
      key: "template",
      label: t("columns.template"),
      width: "minmax(180px,1fr)",
      render: (item) => (
        <span className="block max-w-sm truncate" title={item.template_name}>
          {item.template_name}
        </span>
      ),
    },
    {
      key: "lifecycleState",
      label: t("columns.lifecycleState"),
      width: "minmax(220px,1.3fr)",
      render: (item) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <HuemulLifecycleBadge state={item.lifecycle_state} />
          {item.current_lifecycle_step && (
            <span
              className={`inline-flex max-w-50 items-center truncate px-2 py-1 rounded-full text-xs font-medium ${lifecycleStageColor(item.current_lifecycle_step.step_type)}`}
              title={t("columns.lifecycleStepTooltip")}
            >
              {item.current_lifecycle_step.step_name ??
                t(`assets:lifecycle.stageLabels.${item.current_lifecycle_step.step_type}`, {
                  defaultValue: item.current_lifecycle_step.step_type,
                })}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "progress",
      label: t("columns.progress"),
      width: "120px",
      render: (item) => <WorkflowProgressBar percentage={item.progress_percentage} />,
    },
    {
      key: "lastModified",
      label: t("columns.lastModified"),
      width: "170px",
      render: (item) => <span className="text-sm text-muted-foreground">{formatRelativeTime(item.last_modified_at)}</span>,
    },
  ]

  // Mismas acciones que ofrece el header del panel de detalle (Paperclip/lápiz,
  // ver workflow-detail-panel.tsx) — paridad fila/panel. El separador va en la
  // última acción "segura" antes del destructivo, no fijo en "share".
  const safeActions: HuemulTableAction<WorkflowItem>[] = [
    { key: "share", label: t("actions.share"), icon: Share2, onClick: onShare },
    ...(canOpenAsset ? [{ key: "openAsset", label: t("actions.openAsset"), icon: ExternalLink, onClick: onOpenAsset }] : []),
    ...(canOpenFullscreen ? [{ key: "openFullscreen", label: t("actions.openFullscreen"), icon: Maximize2, onClick: onOpenFullscreen }] : []),
    ...(canViewMedia ? [{ key: "media", label: t("panel.media"), icon: Paperclip, onClick: onViewMedia }] : []),
    ...(canEditAsset ? [{ key: "edit", label: t("panel.edit"), icon: Edit3, onClick: onEditAsset }] : []),
  ]
  if (canDelete && safeActions.length > 0) safeActions[safeActions.length - 1].separator = true
  const actions: HuemulTableAction<WorkflowItem>[] = [
    ...safeActions,
    ...(canDelete
      ? [
          {
            key: "delete",
            label: t("common:delete"),
            icon: Trash2,
            onClick: onDelete,
            destructive: true,
          } as HuemulTableAction<WorkflowItem>,
        ]
      : []),
  ]

  return (
    <HuemulTable
      variant="detailed"
      data={data}
      columns={columns}
      actions={actions}
      className="h-full"
      maxHeight=""
      getRowKey={(item) => item.execution_id}
      onRowClick={onSelectRow}
      activeKey={selectedExecutionId ?? null}
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={onRetry}
      emptyState={{
        icon: WorkflowIcon,
        title: hasActiveFilters ? t("emptyState.noResults") : t("emptyState.empty"),
        description: hasActiveFilters
          ? t("emptyState.noResultsDescription")
          : t("emptyState.emptyDescription"),
      }}
      pagination={pagination}
    />
  )
}
