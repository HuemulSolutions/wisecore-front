import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Workflow as WorkflowIcon } from "lucide-react"
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableColumn, HuemulTablePagination } from "@/huemul/components/huemul-table"
import { HuemulLifecycleBadge } from "@/huemul/components/huemul-lifecycle-badge"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { cn } from "@/lib/utils"
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
}: WorkflowTableProps) {
  const { t } = useTranslation("workflow")

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
      render: (item) => cell(item, <HuemulLifecycleBadge state={item.lifecycle_state} />),
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

  return (
    <HuemulTable
      data={data}
      columns={columns}
      className="h-full"
      maxHeight=""
      getRowKey={(item) => item.execution_id}
      getRowClassName={(item) =>
        cn(item.execution_id === selectedExecutionId && "bg-primary/5 hover:bg-primary/10")
      }
      isLoading={isLoading}
      isFetching={isFetching}
      error={error}
      onRetry={onRetry}
      emptyState={{
        icon: WorkflowIcon,
        title: t("emptyState.title"),
        description: t("emptyState.description"),
      }}
      pagination={pagination}
    />
  )
}
