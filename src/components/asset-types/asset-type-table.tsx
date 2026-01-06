import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Edit2, Trash2, Shield, MoreVertical, FileStack } from "lucide-react"
import { type AssetTypeWithRoles } from "@/services/asset-types"
import { type UseMutationResult } from "@tanstack/react-query"

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
}

export default function AssetTypeTable({
  assetTypes,
  selectedAssetTypes: _selectedAssetTypes,
  onAssetTypeSelection: _onAssetTypeSelection,
  onSelectAll: _onSelectAll,
  onEditAssetType,
  onManagePermissions,
  onDeleteAssetType,
  assetTypeMutations: _assetTypeMutations
}: AssetTypeTableProps) {
  if (assetTypes.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <div className="text-center py-12">
          <FileStack className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No asset types found</h3>
          <p className="text-muted-foreground">
            No asset types have been created yet or match your search criteria.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border border-border bg-card overflow-auto max-h-[75vh]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted z-10">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Color</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Asset Type Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Asset Count</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Role Permissions</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Created</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assetTypes.map((assetType) => (
              <tr key={assetType.document_type_id} className="border-b border-border hover:bg-muted/20 transition">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full border border-border" 
                      style={{ backgroundColor: assetType.document_type_color }}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span className="text-xs font-medium text-foreground">{assetType.document_type_name}</span>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5">
                    {assetType.document_count || 0} assets
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  {assetType.roles && assetType.roles.length > 0 ? (
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
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No roles</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-foreground">
                  {formatDate(assetType.document_type_created_date)}
                </td>
                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="hover:cursor-pointer h-6 w-6 p-0"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => {
                          onManagePermissions(assetType)
                        }, 0)
                      }} className="hover:cursor-pointer">
                        <Shield className="mr-2 h-3 w-3" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => {
                          onEditAssetType(assetType)
                        }, 0)
                      }} className="hover:cursor-pointer">
                        <Edit2 className="mr-2 h-3 w-3" />
                        Edit Asset Type
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => {
                          onDeleteAssetType(assetType)
                        }, 0)
                      }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete Asset Type
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      {assetTypes.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4 py-2 sm:py-3 bg-muted/20 text-xs text-muted-foreground border-t gap-1 sm:gap-0">
          <span className="text-xs">
            Showing {assetTypes.length} asset type{assetTypes.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs">
              {assetTypes.reduce((acc, type) => acc + (type.document_count || 0), 0)} total assets
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}
