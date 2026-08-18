import { Edit2, Trash2, Tag as TagIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Tag, TagsTableProps } from '@/types/tags'
export type { TagsTableProps } from '@/types/tags'
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction } from "@/huemul/components/huemul-table"

const FALLBACK_DOT_COLOR = "#94a3b8"

export function TagsTable({
  tags,
  onEdit,
  onDelete,
  isLoading = false,
  isFetching = false,
  pagination,
  searchTerm = "",
  canUpdate = false,
  canDelete = false,
}: TagsTableProps) {
  const { t, i18n } = useTranslation(['tags', 'common'])

  const columns: HuemulTableColumn<Tag>[] = [
    {
      key: "name",
      label: t('columns.tag'),
      render: (tag) => (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: tag.color ?? FALLBACK_DOT_COLOR }} />
          <span className="text-xs font-medium text-foreground">{tag.name}</span>
        </div>
      )
    },
    {
      key: "description",
      label: t('columns.description'),
      render: (tag) => (
        <div className="max-w-xs truncate text-xs text-foreground" title={tag.description ?? undefined}>
          {tag.description || <span className="text-muted-foreground">{t('columns.noDescription')}</span>}
        </div>
      )
    },
    {
      key: "updated",
      label: t('common:updated'),
      render: (tag) => (
        <span className="text-xs text-foreground">
          {new Date(tag.updated_at).toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    }
  ]

  const actions: HuemulTableAction<Tag>[] = (canUpdate || canDelete) ? [
    ...(canUpdate ? [{
      key: "edit",
      label: t('actions.editTag'),
      icon: Edit2,
      onClick: onEdit,
      separator: canDelete,
    }] : []),
    ...(canDelete ? [{
      key: "delete",
      label: t('actions.deleteTag'),
      icon: Trash2,
      onClick: onDelete,
      destructive: true,
    }] : []),
  ] : []

  return (
    <HuemulTable
      data={tags}
      columns={columns}
      actions={actions}
      getRowKey={(tag) => tag.id}
      emptyState={{
        icon: TagIcon,
        title: searchTerm ? t('emptyState.noResults') : t('emptyState.empty'),
        description: searchTerm ? undefined : t('emptyState.emptyDescription'),
      }}
      isLoading={isLoading}
      isFetching={isFetching}
      pagination={pagination}
    />
  )
}
