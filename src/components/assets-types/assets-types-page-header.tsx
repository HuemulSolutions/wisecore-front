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
  canCreate?: boolean
}

export default function AssetTypePageHeader({ 
  assetTypeCount, 
  onCreateAssetType, 
  onRefresh, 
  isLoading, 
  hasError,
  searchTerm,
  onSearchChange,
  canCreate = true
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
      primaryAction={canCreate ? {
        label: "Create Asset Type",
        icon: Plus,
        onClick: onCreateAssetType
      } : undefined}
      searchConfig={{
        placeholder: "Search asset types...",
        value: searchTerm,
        onChange: onSearchChange
      }}
    />
  )
}
