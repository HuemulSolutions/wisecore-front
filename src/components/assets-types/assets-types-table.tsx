import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Shield, FileStack, Activity } from "lucide-react"
import { type AssetTypeWithRoles } from "@/services/asset-types"
import { type UseMutationResult } from "@tanstack/react-query"
import { DataTable, type PaginationConfig } from "@/components/ui/data-table"
import type { TableColumn, TableAction, FooterStat } from "@/types/data-table"

// Helper functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

interface AssetTypeTableProps {
  assetTypes: AssetTypeWithRoles[]
  selectedAssetTypes: Set<string>
  onAssetTypeSelection: (assetTypeId: string) => void
  onSelectAll: () => void
  onEditAssetType: (assetType: AssetTypeWithRoles) => void
  onManagePermissions: (assetType: AssetTypeWithRoles) => void
  onDeleteAssetType: (assetType: AssetTypeWithRoles) => void
  onLifecycle: (assetType: AssetTypeWithRoles) => void
  assetTypeMutations: {
    createAssetType: UseMutationResult<any, any, any, unknown>
    updateAssetType: UseMutationResult<any, any, any, unknown>
    deleteAssetType: UseMutationResult<any, any, string, unknown>
  }
  pagination?: PaginationConfig
  showFooterStats?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}

export default function AssetTypeTable({
  assetTypes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedAssetTypes: _selectedAssetTypes,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAssetTypeSelection: _onAssetTypeSelection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelectAll: _onSelectAll,
  onEditAssetType,
  onManagePermissions,
  onDeleteAssetType,
  onLifecycle,
  pagination,
  showFooterStats,
  canUpdate = true,
  canDelete = true,
}: AssetTypeTableProps) {
  const { t } = useTranslation('asset-types')

  // Define columns
  const columns: TableColumn<AssetTypeWithRoles>[] = [
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
      key: "roles",
      label: t('columns.rolePermissions'),
      render: (assetType) => {
        if (assetType.roles && assetType.roles.length > 0) {
          return (
            <div className="flex flex-wrap gap-0.5">
              {assetType.roles.slice(0, 2).map((role) => (
                <Badge key={role.role_id} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  <Shield className="w-2 h-2 mr-0.5" />
                  {role.role_name}
                </Badge>
              ))}
              {assetType.roles.length > 2 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  +{assetType.roles.length - 2}
                </Badge>
              )}
            </div>
          )
        }
        return <span className="text-[10px] text-muted-foreground">{t('columns.noRoles')}</span>
      }
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
  const actions: TableAction<AssetTypeWithRoles>[] = [
    {
      key: "permissions",
      label: t('actions.managePermissions'),
      icon: Shield,
      onClick: onManagePermissions
    },
    {
      key: "lifecycle",
      label: t('actions.lifecycle'),
      icon: Activity,
      onClick: onLifecycle
    },
    ...(canUpdate ? [{
      key: "edit" as const,
      label: t('actions.editAssetType'),
      icon: Edit2,
      onClick: onEditAssetType,
      separator: true
    }] : []),
    ...(canDelete ? [{
      key: "delete" as const,
      label: t('actions.deleteAssetType'),
      icon: Trash2,
      onClick: onDeleteAssetType,
      destructive: true
    }] : [])
  ]

  // Define footer stats
  const footerStats: FooterStat[] = [
    {
      label: t('table.showing', { count: assetTypes.length }),
      value: ''
    },
    {
      label: t('table.totalAssets'),
      value: assetTypes.reduce((acc, type) => acc + (type.document_count || 0), 0)
    }
  ]

  return (
    <DataTable
      data={assetTypes}
      columns={columns}
      actions={actions}
      getRowKey={(assetType) => assetType.document_type_id}
      emptyState={{
        icon: FileStack,
        title: t('emptyState.noAssetTypesFound'),
        description: t('emptyState.noResultsDescription')
      }}
      footerStats={footerStats}
      pagination={pagination}
      showFooterStats={showFooterStats}
    />
  )
}
