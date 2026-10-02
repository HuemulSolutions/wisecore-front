import { useTranslation } from "react-i18next"
import { Workflow as WorkflowIcon, Trash2, Share2, Paperclip, Pencil, ExternalLink, Maximize2 } from "lucide-react"
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableAction, HuemulTableColumn, HuemulTablePagination } from "@/huemul/components/huemul-table"
import { HuemulLifecycleStageBadge } from "@/huemul/components/huemul-lifecycle-stage-badge"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { formatDate } from "@/lib/utils"
import type { WorkflowItem } from "@/types/workflow"
import { workflowStageOf } from "./workflow-lifecycle-stage"
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
  const { t } = useTranslation(["workflow", "common"])

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
        <span className="block max-w-sm truncate" title={item.relation_name || item.template_name}>
          {item.relation_name || item.template_name}
        </span>
      ),
    },
    {
      key: "lifecycleState",
      label: t("columns.lifecycleState"),
      width: "minmax(200px,1fr)",
      // Misma píldora «Etapa · grupo» que la fila de ciclo de vida del panel de detalle.
      render: (item) => (
        <HuemulLifecycleStageBadge
          status={workflowStageOf(item)}
          wrap
          className="min-h-[26px] max-w-full rounded-[13px] px-[10px] py-[3px] text-[12px] font-semibold"
        />
      ),
    },
    {
      key: "progress",
      label: t("columns.progress"),
      width: "120px",
      render: (item) => <WorkflowProgressBar percentage={item.progress_percentage} />,
    },
    {
      key: "createdBy",
      label: t("columns.createdBy"),
      width: "minmax(140px,0.8fr)",
      render: (item) =>
        item.created_by_user_name ? (
          <span className="block max-w-xs truncate text-sm" title={item.created_by_user_name}>
            {item.created_by_user_name}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: "createdAt",
      label: t("columns.createdAt"),
      width: "120px",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {item.created_at ? formatDate(new Date(item.created_at), { year: "numeric", month: "short", day: "numeric" }) : "—"}
        </span>
      ),
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
    ...(canEditAsset ? [{ key: "edit", label: t("panel.edit"), icon: Pencil, onClick: onEditAsset }] : []),
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
