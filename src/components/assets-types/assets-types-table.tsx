import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Trash2, FileStack, Copy, GitMerge, Settings2 } from "lucide-react"
import { type AssetTypeWithRoles } from "@/services/asset-types"
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction } from "@/huemul/components/huemul-table"
import type { AssetTypeTableProps } from '@/types/assets'

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
  assetTypes,
  onConfigureAssetType,
  onDeleteAssetType,
  onCloneAssetType,
  onViewRelationships,
  pagination,
  canConfigure = false,
  canDelete = false,
  canViewRelationships = false,
  canClone = false,
  isLoading = false,
  isFetching = false,
  selectedIds,
  onSelectionChange,
}: AssetTypeTableProps) {
  const { t } = useTranslation('asset-types')

  // Define columns
  const columns: HuemulTableColumn<AssetTypeWithRoles>[] = [
    {
      key: "color",
      label: t('columns.color'),
      render: (assetType) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-full border border-border" 
            style={{ backgroundColor: assetType.document_type_color }}
          />
        </div>
      )
    },
    {
      key: "name",
      label: t('columns.name'),
      render: (assetType) => (
        <span className="text-xs font-medium text-foreground">{assetType.document_type_name}</span>
      )
    },
    {
      key: "count",
      label: t('columns.assetCount'),
      render: (assetType) => (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {t('columns.assets', { count: assetType.document_count || 0 })}
        </Badge>
      )
    },
    {
      key: "created",
      label: t('columns.created'),
      render: (assetType) => (
        <span className="text-xs text-foreground">{formatDate(assetType.document_type_created_date)}</span>
      )
    }
  ]

  // Define actions - construir condicionalmente
  const actions: HuemulTableAction<AssetTypeWithRoles>[] = [
    ...(canConfigure ? [{
      key: "configure" as const,
      label: t('actions.configureAssetType'),
      icon: Settings2,
      onClick: onConfigureAssetType
    }] : []),
    ...(canViewRelationships ? [{
      key: "viewRelationships" as const,
      label: t('actions.viewRelationships'),
      icon: GitMerge,
      onClick: onViewRelationships
    }] : []),
    ...(canClone ? [{
      key: "clone" as const,
      label: t('actions.cloneAssetType'),
      icon: Copy,
      onClick: onCloneAssetType
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

  return (
    <HuemulTable
      data={assetTypes}
      columns={columns}
      actions={actions}
      getRowKey={(assetType) => assetType.document_type_id}
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
    />
  )
}
