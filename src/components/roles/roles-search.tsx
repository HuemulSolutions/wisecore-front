import { useTranslation } from "react-i18next"
import { Shield, Plus, Download, Upload } from "lucide-react"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import type { RolesSearchProps } from '@/types/roles'
export type { RolesSearchProps } from '@/types/roles'

export function RolesSearch({
  searchTerm,
  onSearchChange,
  rolesCount,
  isRefreshing,
  onRefresh,
  onCreateRole,
  hasError,
  canManage = false,
  onExport,
  onImport,
  canExport,
  canImport,
  exportSelectedCount = 0,
  isExporting = false,
}: RolesSearchProps) {
  const { t } = useTranslation('roles')
  return (
    <PageHeader
      icon={Shield}
      title={t('header.title')}
      badges={[
        { label: "", value: t('header.rolesCount', { count: rolesCount }) }
      ]}
      onRefresh={onRefresh}
      isLoading={isRefreshing}
      hasError={hasError}
      additionalActions={[
        ...(canExport && onExport ? [{
          label: exportSelectedCount > 0 ? `${t('exportImport.exportButton')} (${exportSelectedCount})` : t('exportImport.exportButton'),
          icon: Upload,
          onClick: onExport,
          disabled: exportSelectedCount === 0 || isExporting,
        }] : []),
        ...(canImport && onImport ? [{ label: t('exportImport.importButton'), icon: Download, onClick: onImport }] : []),
      ]}
      primaryAction={canManage ? {
        label: t('header.createRole'),
        icon: Plus,
        onClick: onCreateRole
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
