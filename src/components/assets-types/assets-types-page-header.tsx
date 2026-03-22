import { FileStack, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"

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
  const { t } = useTranslation('asset-types')

  return (
    <PageHeader
      icon={FileStack}
      title={t('header.title')}
      badges={[
        { label: "", value: t('header.assetTypesCount', { count: assetTypeCount }) }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      hasError={hasError}
      primaryAction={canCreate ? {
        label: t('header.createAssetType'),
        icon: Plus,
        onClick: onCreateAssetType
      } : undefined}
      searchConfig={{
        placeholder: t('header.searchPlaceholder'),
        value: searchTerm,
        onChange: onSearchChange,
        triggerOnEnter: true
      }}
    />
  )
}
