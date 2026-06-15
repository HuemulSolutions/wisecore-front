import { FileStack, GitMerge, Plus, Table2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import type { AssetTypePageHeaderProps } from '@/types/assets'

export type { AssetTypePageHeaderProps } from '@/types/assets'

export default function AssetTypePageHeader({ 
  assetTypeCount, 
  onCreateAssetType, 
  onRefresh, 
  isLoading, 
  hasError,
  searchTerm,
  onSearchChange,
  canCreate = true,
  viewMode,
  onViewModeChange,
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
      additionalActions={viewMode !== undefined && onViewModeChange ? [
        {
          label: viewMode === 'table' ? t('header.viewRelationships') : t('header.viewTable'),
          icon: viewMode === 'table' ? GitMerge : Table2,
          onClick: () => onViewModeChange(viewMode === 'table' ? 'relationships' : 'table'),
        }
      ] : []}
      primaryAction={canCreate ? {
        label: t('header.createAssetType'),
        icon: Plus,
        onClick: onCreateAssetType
      } : undefined}
      searchConfig={viewMode === 'table' ? {
        placeholder: t('header.searchPlaceholder'),
        value: searchTerm,
        onChange: onSearchChange,
        triggerOnEnter: true
      } : undefined}
    />
  )
}
