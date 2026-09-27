import { Shield, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AuthTypesSearchProps } from '@/types/auth-types'

export type { AuthTypesSearchProps } from '@/types/auth-types'

const ALL_ORGANIZATIONS = '__all__'

export function AuthTypesSearch({
  searchTerm,
  onSearchChange,
  authTypesCount,
  isLoading,
  onRefresh,
  onCreateClick,
  hasError,
  canManage = false,
  organizationFilter,
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
    >
      {organizationFilter && (
        // Radix Select no admite `value=""`: "todas" viaja como `__all__`.
        <Select
          value={organizationFilter.value || ALL_ORGANIZATIONS}
          onValueChange={(value) => organizationFilter.onChange(value === ALL_ORGANIZATIONS ? '' : value)}
        >
          <SelectTrigger className="w-full md:w-48 h-8 hover:cursor-pointer text-xs" aria-label={t('header.organizationFilter')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ORGANIZATIONS}>{t('header.allOrganizations')}</SelectItem>
            {organizationFilter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </PageHeader>
  )
}