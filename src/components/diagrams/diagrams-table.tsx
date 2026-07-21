import { Eye, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableColumn, HuemulTableAction, HuemulTablePagination } from "@/types/huemul"
import type { Diagram } from "@/types/diagrams"

export interface DiagramsTableProps {
  items: Diagram[]
  onView: (diagram: Diagram) => void
  onDelete: (diagram: Diagram) => void
  pagination?: HuemulTablePagination
  canView?: boolean
  canDelete?: boolean
  isLoading?: boolean
  isFetching?: boolean
}

export function DiagramsTable({
  items,
  onView,
  onDelete,
  pagination,
  canView = false,
  canDelete = false,
  isLoading = false,
  isFetching = false,
}: DiagramsTableProps) {
  const { t, i18n } = useTranslation(['diagrams', 'common'])

  const columns: HuemulTableColumn<Diagram>[] = [
    {
      key: "name",
      label: t('columns.name'),
      render: (diagram) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">{diagram.name}</span>
          <span className="text-[10px] text-muted-foreground">ID: {diagram.id}</span>
        </div>
      ),
    },
    {
      key: "execution",
      label: t('columns.execution'),
      render: (diagram) => (
        <span className="text-xs font-mono text-muted-foreground">
          {diagram.execution_id.slice(0, 8)}…
        </span>
      ),
    },
    {
      key: "description",
      label: t('columns.description'),
      render: (diagram) => (
        <span className="text-xs text-muted-foreground line-clamp-1">
          {diagram.description || '—'}
        </span>
      ),
    },
    {
      key: "created",
      label: t('common:created'),
      render: (diagram) => (
        <span className="text-xs text-foreground">
          {new Date(diagram.created_at).toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
  ]

  const actions: HuemulTableAction<Diagram>[] = [
    {
      key: "view",
      label: t('actions.view'),
      icon: Eye,
      onClick: onView,
      show: () => canView,
    },
    {
      key: "delete",
      label: t('actions.deleteDiagram'),
      icon: Trash2,
      onClick: onDelete,
      destructive: true,
      show: () => canDelete,
    },
  ]

  return (
    <HuemulTable
      data={items}
      columns={columns}
      actions={actions}
      pagination={pagination}
      isLoading={isLoading}
      isFetching={isFetching}
      getRowKey={(diagram) => diagram.id}
    />
  )
}
