import { useMemo, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Workflow as WorkflowIcon, Trash2, Share2 } from "lucide-react"
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
  hasActiveFilters,
}: WorkflowTableProps) {
  const { t } = useTranslation(["workflow", "common", "assets"])

  // Cada celda envuelve su contenido en un div clickeable: no hay onRowClick nativo en
  // HuemulTable, así que el click de fila se implementa a nivel de celda (mismo patrón
  // que los botones inline dentro de celdas en otras tablas del proyecto).
  const cell = (item: WorkflowItem, content: ReactNode) => (
    <div className="cursor-pointer" onClick={() => onSelectRow(item)}>
      {content}
    </div>
  )

  const columns: HuemulTableColumn<WorkflowItem>[] = [
    {
      key: "internalCode",
      label: t("columns.internalCode"),
      render: (item) => cell(item, <span className="font-mono text-xs">{item.internal_code}</span>),
    },
    {
      key: "documentName",
      label: t("columns.documentName"),
      render: (item) => cell(item, <span className="truncate">{item.document_name}</span>),
    },
    {
      key: "template",
      label: t("columns.template"),
      render: (item) => cell(item, <span>{item.template_name}</span>),
    },
    {
      key: "lifecycleState",
      label: t("columns.lifecycleState"),
      render: (item) =>
        cell(
          item,
          <div className="flex items-center gap-1.5 flex-wrap">
            <HuemulLifecycleBadge state={item.lifecycle_state} />
            {item.current_lifecycle_step && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${lifecycleStageColor(item.current_lifecycle_step.step_type)}`}
                title={t("columns.lifecycleStepTooltip")}
              >
                {item.current_lifecycle_step.step_name ??
                  t(`assets:lifecycle.stageLabels.${item.current_lifecycle_step.step_type}`, {
                    defaultValue: item.current_lifecycle_step.step_type,
                  })}
              </span>
            )}
          </div>,
        ),
    },
    {
      key: "progress",
      label: t("columns.progress"),
      render: (item) => cell(item, <WorkflowProgressBar percentage={item.progress_percentage} />),
    },
    {
      key: "currentStep",
      label: t("columns.currentStep"),
      render: (item) => cell(item, <span>{item.current_step?.section_name ?? "—"}</span>),
    },
    {
      key: "lastModified",
      label: t("columns.lastModified"),
      render: (item) => cell(item, <span className="text-sm text-muted-foreground">{formatRelativeTime(item.last_modified_at)}</span>),
    },
  ]

  const actions: HuemulTableAction<WorkflowItem>[] = [
    {
      key: "share",
      label: t("actions.share"),
      icon: Share2,
      onClick: onShare,
      separator: canDelete,
    },
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

  // Resaltado de fila sin columna de checkboxes: `selectedKeys` sin `selectable`
  // (ver JSDoc en types/huemul/table.ts) genera el par de fondos opacos que la
  // celda sticky de acciones necesita, en vez de un className con alpha.
  const selectedKeys = useMemo(
    () => new Set(selectedExecutionId ? [selectedExecutionId] : []),
    [selectedExecutionId],
  )

  return (
    <HuemulTable
      data={data}
      columns={columns}
      actions={actions}
      className="h-full"
      maxHeight=""
      getRowKey={(item) => item.execution_id}
      selectedKeys={selectedKeys}
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
