import { type AssetTypeWithRoles } from "@/services/asset-types"

export interface AssetTypePageState {
  searchTerm: string
  selectedAssetTypes: Set<string>
  editingAssetType: AssetTypeWithRoles | null
  showCreateDialog: boolean
  deletingAssetType: AssetTypeWithRoles | null
  rolePermissionsAssetType: AssetTypeWithRoles | null
}

export interface AssetTypePageActions {
  updateState: (updates: Partial<AssetTypePageState>) => void
  closeDialog: (dialog: keyof AssetTypePageState) => void
  handleAssetTypeSelection: (assetTypeId: string) => void
  handleSelectAll: () => void
}
