import { Edit2, Trash2, Tag as TagIcon, ExternalLink, Search, FileStack, Layers } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Tag, TagsTableProps } from '@/types/tags'
export type { TagsTableProps } from '@/types/tags'
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction, type HuemulTableActionItem } from "@/huemul/components/huemul-table"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useOrgNavigate } from "@/hooks/useOrgRouter"

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
  const navigate = useOrgNavigate()
  const { hasAnyPermission } = useUserPermissions()

  // Cada acción "ver X" navega a un listado ajeno a /tags: se gatea con el
  // permiso de listado del destino (mismo criterio que search.tsx), no con
  // tag:r — ver etiquetas no implica poder ver templates/asset types/docs.
  const canViewTemplates = hasAnyPermission(['template:l', 'template:r'])
  const canViewAssetTypes = hasAnyPermission(['asset_type:l', 'asset_type:r'])
  const canViewDocuments = hasAnyPermission(['asset:l', 'asset:r'])

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

  const canViewAnyObjects = canViewDocuments || canViewTemplates || canViewAssetTypes

  const viewObjectsItems = (tag: Tag): HuemulTableActionItem<Tag>[] => [
    ...(canViewDocuments ? [{
      key: "view-documents",
      label: t('actions.viewDocuments'),
      icon: Search,
      onClick: () => navigate(`/search?tag_id=${tag.id}`),
    }] : []),
    ...(canViewTemplates ? [{
      key: "view-templates",
      label: t('actions.viewTemplates'),
      icon: FileStack,
      onClick: () => navigate(`/templates?tag_id=${tag.id}`),
    }] : []),
    ...(canViewAssetTypes ? [{
      key: "view-asset-types",
      label: t('actions.viewAssetTypes'),
      icon: Layers,
      onClick: () => navigate(`/asset-types?tag_id=${tag.id}`),
    }] : []),
  ]

  const actions: HuemulTableAction<Tag>[] = (canUpdate || canDelete || canViewAnyObjects) ? [
    ...(canViewAnyObjects ? [{
      key: "view-objects",
      label: t('actions.viewObjects'),
      icon: ExternalLink,
      onClick: () => {},
      items: viewObjectsItems,
      separator: canUpdate || canDelete,
    }] : []),
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
