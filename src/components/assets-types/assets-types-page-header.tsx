import { Download, FileStack, FolderPlus, GitMerge, Plus, Table2, Upload } from "lucide-react"
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
  canCreate = false,
  viewMode,
  onViewModeChange,
  onExport,
  onImport,
  canExport,
  canImport,
  exportSelectedCount = 0,
  onCreateFolder,
  canCreateFolder = false,
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
      additionalActions={[
        ...(canCreateFolder && onCreateFolder && viewMode !== 'relationships' ? [{
          label: t('folders.newFolder'),
          icon: FolderPlus,
          onClick: onCreateFolder,
        }] : []),
        ...(canExport && onExport ? [{
          label: exportSelectedCount > 0 ? `${t('exportImport.exportButton')} (${exportSelectedCount})` : t('exportImport.exportButton'),
          icon: Upload,
          onClick: onExport,
          disabled: exportSelectedCount === 0,
        }] : []),
        ...(canImport && onImport ? [{ label: t('exportImport.importButton'), icon: Download, onClick: onImport }] : []),
        ...(viewMode !== undefined && onViewModeChange ? [
          {
            label: viewMode === 'table' ? t('header.viewRelationships') : t('header.viewTable'),
            icon: viewMode === 'table' ? GitMerge : Table2,
            onClick: () => onViewModeChange(viewMode === 'table' ? 'relationships' : 'table'),
          }
        ] : []),
      ]}
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
