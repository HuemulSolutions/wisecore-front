import { Users, Plus } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { PageHeader } from "@/huemul/components/huemul-page-header"
import ProtectedComponent from "@/components/protected-component"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { UserPageHeaderProps } from '@/types/users';
export type { UserPageHeaderProps } from '@/types/users';

export default function UserPageHeader({ 
  userCount, 
  onCreateUser, 
  onRefresh, 
  isLoading, 
  hasError,
  searchTerm,
  onSearchChange,
  filterStatus,
  onStatusFilterChange,
  canCreate = false
}: UserPageHeaderProps) {
  const { t } = useTranslation(['users', 'common'])

  return (
    <PageHeader
      icon={Users}
      title={t('users:header.title')}
      badges={[
        { label: "", value: t('users:header.usersCount', { count: userCount }) }
      ]}
      onRefresh={onRefresh}
      isLoading={isLoading}
      hasError={hasError}
      primaryAction={canCreate ? {
        label: t('users:header.addUser'),
        icon: Plus,
        onClick: onCreateUser,
        protectedContent: (
          <ProtectedComponent permission="user:c">
            <HuemulButton
              label={t('users:header.addUser')}
              icon={Plus}
              size="sm"
              onClick={onCreateUser}
              disabled={hasError}
              className="h-8 text-xs px-2"
            />
          </ProtectedComponent>
        )
      } : undefined}
      searchConfig={{
        placeholder: t('users:header.searchPlaceholder'),
        value: searchTerm,
        onChange: onSearchChange,
        triggerOnEnter: true,
      }}
    >
      <Select value={filterStatus} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-full md:w-36 h-8 hover:cursor-pointer text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('users:header.filterAllStatus')}</SelectItem>
          <SelectItem value="active">{t('common:active')}</SelectItem>
          <SelectItem value="inactive">{t('common:inactive')}</SelectItem>
          <SelectItem value="pending">{t('common:pending')}</SelectItem>
        </SelectContent>
      </Select>
    </PageHeader>
  )
}