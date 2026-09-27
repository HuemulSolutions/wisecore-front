import { ChevronRight, Trash2, Tag as TagIcon, Search, FileStack, Layers } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { Tag, TagsTableProps } from '@/types/tags'
export type { TagsTableProps } from '@/types/tags'
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction } from "@/huemul/components/huemul-table"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { formatDate } from "@/components/users"

const FALLBACK_DOT_COLOR = "#94a3b8"

export function TagsTable({
  tags,
  onSelectTag,
  selectedTagId,
  onDelete,
  isLoading = false,
  isFetching = false,
  pagination,
  searchTerm = "",
  canUpdate = false,
  canDelete = false,
}: TagsTableProps) {
  const { t } = useTranslation(['tags', 'common'])
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
      width: "minmax(0,1.4fr)",
      render: (tag) => (
        <div className="flex items-center gap-2.5">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color ?? FALLBACK_DOT_COLOR }} />
          <div className="flex min-w-0 flex-col gap-0">
            <span className="truncate text-[13.5px] font-semibold leading-tight text-[#0f172a]">
              {tag.name}
            </span>
            <span className="truncate text-xs leading-tight text-[#7c8798]" title={tag.description ?? undefined}>
              {tag.description || t('columns.noDescription')}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "updated",
      label: t('common:updated'),
      width: "120px",
      render: (tag) => (
        <span className="text-xs text-[#7c8798]">{formatDate(tag.updated_at)}</span>
      )
    },
    {
      key: "chevron",
      label: "",
      align: "right",
      width: "40px",
      render: () =>
        canUpdate ? <ChevronRight className="ml-auto size-[15px] text-[#b6c0cd]" /> : null
    }
  ]

  // `variant="detailed"` solo admite un menú plano (sin sub-`items`): los
  // links "Ver …" van al primer nivel y Editar sale del menú porque ya lo hace
  // el click de la fila.
  const actions: HuemulTableAction<Tag>[] = [
    ...(canViewDocuments ? [{
      key: "view-documents",
      label: t('actions.viewDocuments'),
      icon: Search,
      onClick: (tag: Tag) => navigate(`/search?tag_id=${tag.id}`),
      separator: !canViewTemplates && !canViewAssetTypes && canDelete,
    }] : []),
    ...(canViewTemplates ? [{
      key: "view-templates",
      label: t('actions.viewTemplates'),
      icon: FileStack,
      onClick: (tag: Tag) => navigate(`/templates?tag_id=${tag.id}`),
      separator: !canViewAssetTypes && canDelete,
    }] : []),
    ...(canViewAssetTypes ? [{
      key: "view-asset-types",
      label: t('actions.viewAssetTypes'),
      icon: Layers,
      onClick: (tag: Tag) => navigate(`/asset-types?tag_id=${tag.id}`),
      separator: canDelete,
    }] : []),
    ...(canDelete ? [{
      key: "delete",
      label: t('actions.deleteTag'),
      icon: Trash2,
      onClick: onDelete,
      destructive: true,
    }] : []),
  ]

  return (
    <HuemulTable
      variant="detailed"
      data={tags}
      columns={columns}
      actions={actions}
      getRowKey={(tag) => tag.id}
      onRowClick={canUpdate ? onSelectTag : undefined}
      activeKey={selectedTagId ?? null}
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
