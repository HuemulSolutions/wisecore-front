import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { TagsObjectPicker } from "@/components/tags"
import { Trash2, FileStack, Copy, GitMerge, Settings2 } from "lucide-react"
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction, type HuemulTableFolders } from "@/huemul/components/huemul-table"
import type { AssetTypeTableProps } from '@/types/assets'
import type { AssetTypeWithRoles } from '@/types/assets'

export type { AssetTypeTableProps } from '@/types/assets'

// Helper functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function AssetTypeTable({
  data,
  folders,
  folderItemCounts,
  expandedFolderIds,
  onExpandedFolderIdsChange,
  onConfigureAssetType,
  onDeleteAssetType,
  onCloneAssetType,
  onViewRelationships,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolderRequest,
  onMoveAssetType,
  pagination,
  canConfigure = false,
  canDelete = false,
  canViewRelationships = false,
  canClone = false,
  canManageFolders = false,
  canCreateFolder = false,
  canDeleteFolder = false,
  canViewTags = false,
  canManageTags = false,
  initialTags,
  isLoading = false,
  isFetching = false,
  selectedIds,
  onSelectionChange,
}: AssetTypeTableProps) {
  const { t } = useTranslation('asset-types')

  const columns: HuemulTableColumn<AssetTypeWithRoles>[] = [
    {
      key: "color",
      label: t('columns.color'),
      primary: false,
      render: (at) => (
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full border border-border"
            style={{ backgroundColor: at.document_type_color }}
          />
        </div>
      )
    },
    {
      key: "name",
      label: t('columns.name'),
      primary: true,
      render: (at) => <span className="text-xs font-medium text-foreground">{at.document_type_name}</span>
    },
    ...(canViewTags ? [{
      key: "tags",
      label: t('columns.tags'),
      render: (at: AssetTypeWithRoles) => (
        // La fila entera es `draggable` cuando hay carpetas (ver `folders`), y
        // las celdas de datos de HuemulTable no cortan la propagación: sin
        // esto, arrastrar desde el "+" o la "x" de un chip movería el tipo de
        // documento de carpeta. Mismo recurso que usan las celdas de checkbox
        // y de acciones dentro de HuemulTable.
        <div
          onDragStart={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <TagsObjectPicker
            objectType="document_type"
            objectIds={[at.document_type_id]}
            variant="cell"
            canView={canViewTags}
            canAssign={canManageTags}
            initialTags={initialTags}
          />
        </div>
      )
    }] : []),
    {
      key: "count",
      label: t('columns.assetCount'),
      render: (at) => (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {t('columns.assets', { count: at.document_count || 0 })}
        </Badge>
      )
    },
    {
      key: "created",
      label: t('columns.created'),
      render: (at) => <span className="text-xs text-foreground">{formatDate(at.document_type_created_date)}</span>
    }
  ]

  const actions: HuemulTableAction<AssetTypeWithRoles>[] = [
    ...(canConfigure ? [{
      key: "configure" as const,
      label: t('actions.configureAssetType'),
      icon: Settings2,
      onClick: onConfigureAssetType,
    }] : []),
    ...(canViewRelationships ? [{
      key: "viewRelationships" as const,
      label: t('actions.viewRelationships'),
      icon: GitMerge,
      onClick: onViewRelationships,
    }] : []),
    ...(canClone ? [{
      key: "clone" as const,
      label: t('actions.cloneAssetType'),
      icon: Copy,
      onClick: onCloneAssetType,
    }] : []),
    ...(canDelete ? [{
      key: "delete" as const,
      label: t('actions.deleteAssetType'),
      icon: Trash2,
      onClick: onDeleteAssetType,
      destructive: true,
      separator: true
    }] : [])
  ]

  const tableFolders: HuemulTableFolders<AssetTypeWithRoles> = {
    folders: folders.map((f) => ({ id: f.id, name: f.name, itemCount: folderItemCounts[f.id] ?? 0 })),
    getFolderId: (at) => at.document_type_folder_id ?? null,
    openFolders: expandedFolderIds,
    onOpenFoldersChange: onExpandedFolderIdsChange,
    onMoveRow: (at, folderId) => onMoveAssetType(at.document_type_id, folderId),
    onCreateFolder: (name) => onCreateFolder(name),
    onRenameFolder: canManageFolders ? (folder, name) => onRenameFolder(folder.id, name) : undefined,
    onDeleteFolder: canDeleteFolder ? (folder) => onDeleteFolderRequest({ id: folder.id, name: folder.name }) : undefined,
    renderCount: (count) => t('folders.typesCount', { count }),
    canDragRows: canManageFolders,
    canCreateFolder,
  }

  return (
    <HuemulTable
      data={data}
      columns={columns}
      actions={actions}
      getRowKey={(at) => at.document_type_id}
      emptyState={{
        icon: FileStack,
        title: t('emptyState.noAssetTypesFound'),
        description: t('emptyState.noResultsDescription')
      }}
      pagination={pagination}
      isLoading={isLoading}
      isFetching={isFetching}
      selectable
      selectedKeys={selectedIds}
      onSelectionChange={onSelectionChange}
      folders={tableFolders}
    />
  )
}
