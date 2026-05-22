import type { AssetTypeWithRoles } from '@/services/asset-types'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

export interface AssetTypeTableProps {
  assetTypes: AssetTypeWithRoles[]
  onEditAssetType: (assetType: AssetTypeWithRoles) => void
  onDeleteAssetType: (assetType: AssetTypeWithRoles) => void
  onCloneAssetType: (assetType: AssetTypeWithRoles) => void
  onLifecycle: (assetType: AssetTypeWithRoles) => void
  pagination?: HuemulTablePagination
  canUpdate?: boolean
  canDelete?: boolean
  isLoading?: boolean
  isFetching?: boolean
}
