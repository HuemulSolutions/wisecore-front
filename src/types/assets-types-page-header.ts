export interface AssetTypePageHeaderProps {
  assetTypeCount: number
  onCreateAssetType: () => void
  onRefresh: () => void
  isLoading: boolean
  hasError?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  canCreate?: boolean
}
