import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, Shield, FileStack } from "lucide-react"
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
  selectedAssetTypes: _selectedAssetTypes,
  onAssetTypeSelection: _onAssetTypeSelection,
  onSelectAll: _onSelectAll,
  onEditAssetType,
  onManagePermissions,
  onDeleteAssetType,
  pagination,
  showFooterStats,
  canUpdate = true,
  canDelete = true,
}: AssetTypeTableProps) {
  // Define columns
  const columns: TableColumn<AssetTypeWithRoles>[] = [
    {
      key: "color",
      label: "Color",
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
      label: "Asset Type Name",
      render: (assetType) => (
        <span className="text-xs font-medium text-foreground">{assetType.document_type_name}</span>
      )
    },
    {
      key: "count",
      label: "Asset Count",
      render: (assetType) => (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {assetType.document_count || 0} assets
        </Badge>
      )
    },
    {
      key: "roles",
      label: "Role Permissions",
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
        return <span className="text-[10px] text-muted-foreground">No roles</span>
      }
    },
    {
      key: "created",
      label: "Created",
      render: (assetType) => (
        <span className="text-xs text-foreground">{formatDate(assetType.document_type_created_date)}</span>
      )
    }
  ]

  // Define actions - construir condicionalmente
  const actions: TableAction<AssetTypeWithRoles>[] = [
    {
      key: "permissions",
      label: "Manage Permissions",
      icon: Shield,
      onClick: onManagePermissions
    },
    ...(canUpdate ? [{
      key: "edit" as const,
      label: "Edit Asset Type",
      icon: Edit2,
      onClick: onEditAssetType,
      separator: true
    }] : []),
    ...(canDelete ? [{
      key: "delete" as const,
      label: "Delete Asset Type",
      icon: Trash2,
      onClick: onDeleteAssetType,
      destructive: true
    }] : [])
  ]

  // Define footer stats
  const footerStats: FooterStat[] = [
    {
      label: `Showing ${assetTypes.length} asset type${assetTypes.length !== 1 ? 's' : ''}`,
      value: ''
    },
    {
      label: 'total assets',
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
        title: "No asset types found",
        description: "No asset types have been created yet or match your search criteria."
      }}
      footerStats={footerStats}
      pagination={pagination}
      showFooterStats={showFooterStats}
    />
  )
}
