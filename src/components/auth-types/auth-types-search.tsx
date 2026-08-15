import { Shield, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import type { AuthTypesSearchProps } from '@/types/auth-types'

export type { AuthTypesSearchProps } from '@/types/auth-types'

export function AuthTypesSearch({
  searchTerm,
  onSearchChange,
  authTypesCount,
  isLoading,
  onRefresh,
  onCreateClick,
  hasError,
  canManage = false,
}: AuthTypesSearchProps) {
  const { t } = useTranslation('auth-types')

  return (
    <PageHeader
      icon={Shield}
      title={t('header.title')}
      badges={[
        { label: "", value: t('header.authTypesCount', { count: authTypesCount }) }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      hasError={hasError}
      primaryAction={canManage ? {
        label: t('header.addAuthType'),
        icon: Plus,
        onClick: onCreateClick,
        disabled: hasError,
      } : undefined}
      searchConfig={{
        placeholder: t('header.searchPlaceholder'),
        value: searchTerm,
        onChange: onSearchChange,
        minLength: 1,
        triggerOnEnter: true,
      }}
    />
  )
}