import { Shield, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import ProtectedComponent from "@/components/protected-component"
import { HuemulButton } from "@/huemul/components/huemul-button"

interface AuthTypesSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  authTypesCount: number
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError?: boolean
}

export function AuthTypesSearch({ 
  searchTerm, 
  onSearchChange,
  authTypesCount,
  isLoading,
  onRefresh,
  onCreateClick,
  hasError
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
      primaryAction={{
        label: t('header.addAuthType'),
        icon: Plus,
        onClick: onCreateClick,
        protectedContent: (
          <ProtectedComponent requireRootAdmin>
            <HuemulButton
              size="sm"
              icon={Plus}
              label={t('header.addAuthType')}
              onClick={onCreateClick}
              disabled={hasError}
              className="h-8 text-xs px-2"
            />
          </ProtectedComponent>
        )
      }}
      searchConfig={{
        placeholder: t('header.searchPlaceholder'),
        value: searchTerm,
        onChange: onSearchChange
      }}
    />
  )
}