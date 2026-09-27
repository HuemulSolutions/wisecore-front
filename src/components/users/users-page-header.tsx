import { Users, Plus } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { PageHeader } from "@/huemul/components/huemul-page-header"
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
  canCreate = false
}: UserPageHeaderProps) {
  const { t } = useTranslation(['users', 'common'])

  // Un solo gate para el botón de crear: `protectedContent` REEMPLAZA al botón
  // dentro de PageHeader, así que tenerlo con criterio propio además de
  // `primaryAction` era doble gate sobre la misma condición (`user:c`).
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
        disabled: hasError,
      } : undefined}
      searchConfig={{
        placeholder: t('users:header.searchPlaceholder'),
        value: searchTerm,
        onChange: onSearchChange,
        triggerOnEnter: true,
      }}
    />
  )
}