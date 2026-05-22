import { useTranslation } from "react-i18next"
import { Shield, Plus } from "lucide-react"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import type { RolesSearchProps } from '@/types/roles-search'
export type { RolesSearchProps } from '@/types/roles-search'

export function RolesSearch({
  searchTerm,
  onSearchChange,
  rolesCount,
  isRefreshing,
  onRefresh,
  onCreateRole,
  hasError,
  canManage = false
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
