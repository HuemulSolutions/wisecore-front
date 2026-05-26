import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2 } from "lucide-react"
import type { Canvas, CanvasTableProps } from '@/types/canvas'
export type { CanvasTableProps } from '@/types/canvas'
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableColumn, HuemulTableAction } from "@/types/huemul"
import { useTranslation } from "react-i18next"

export function CanvasTable({
  items,
  onEdit,
  onDelete,
  pagination,
  canManage = false,
  isLoading = false,
  isFetching = false,
}: CanvasTableProps) {
  const { t, i18n } = useTranslation(['canvas', 'common'])

  const columns: HuemulTableColumn<Canvas>[] = [
    {
      key: "name",
      label: t('columns.name'),
      render: (canvas) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">{canvas.name}</span>
          <span className="text-[10px] text-muted-foreground">ID: {canvas.id}</span>
        </div>
      ),
    },
    {
      key: "dimensions",
      label: t('columns.dimensions'),
      render: (canvas) => (
        <span className="text-xs text-foreground">
          {canvas.width} × {canvas.height}
        </span>
      ),
    },
    {
      key: "status",
      label: t('columns.status'),
      render: (canvas) => (
        <Badge
          variant="outline"
          className={
            canvas.is_active
              ? "text-[10px] px-1.5 py-0 h-5 bg-green-100/80 text-green-700 border-green-200"
              : "text-[10px] px-1.5 py-0 h-5 bg-red-100/80 text-red-700 border-red-200"
          }
        >
          {canvas.is_active ? t('status.active') : t('status.inactive')}
        </Badge>
      ),
    },
    {
      key: "editable",
      label: t('columns.editable'),
      render: (canvas) => (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {canvas.is_editable ? t('common:yes', 'Yes') : t('common:no', 'No')}
        </Badge>
      ),
    },
    {
      key: "created",
      label: t('common:created'),
      render: (canvas) => (
        <span className="text-xs text-foreground">
          {new Date(canvas.created_at).toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
  ]

  const actions: HuemulTableAction<Canvas>[] = canManage
    ? [
        {
          key: "edit",
          label: t('actions.editCanvas'),
          icon: Edit2,
          onClick: onEdit,
        },
        {
          key: "delete",
          label: t('actions.deleteCanvas'),
          icon: Trash2,
          onClick: onDelete,
          destructive: true,
        },
      ]
    : []

  return (
    <HuemulTable
      data={items}
      columns={columns}
      actions={actions}
      pagination={pagination}
      isLoading={isLoading}
      isFetching={isFetching}
      getRowKey={(canvas) => canvas.id}
    />
  )
}
