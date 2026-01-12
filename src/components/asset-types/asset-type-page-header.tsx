import { FileStack, Plus } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"

interface AssetTypePageHeaderProps {
  assetTypeCount: number
  onCreateAssetType: () => void
  onRefresh: () => void
  isLoading: boolean
  hasError?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
}

export default function AssetTypePageHeader({ 
  assetTypeCount, 
  onCreateAssetType, 
  onRefresh, 
  isLoading, 
  hasError,
  searchTerm,
  onSearchChange
}: AssetTypePageHeaderProps) {
  return (
    <PageHeader
      icon={FileStack}
      title="Asset Types"
      badges={[
        { label: "", value: `${assetTypeCount} types` }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      hasError={hasError}
      primaryAction={{
        label: "Create Asset Type",
        icon: Plus,
        onClick: onCreateAssetType
      }}
      searchConfig={{
        placeholder: "Search asset types...",
        value: searchTerm,
        onChange: onSearchChange
      }}
    />
  )
}
