import { Building } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import type { EmptyStateProps } from '@/types/users/components';
export type { EmptyStateProps as UserPageEmptyStateProps } from '@/types/users/components';

export default function UserPageEmptyState({ type, message }: EmptyStateProps) {
  const { t } = useTranslation(['users', 'common'])

  if (type === 'access-denied') {
    return <HuemulAccessDenied description={t('users:emptyState.accessDeniedDescription')} />
  }

  if (type === 'no-organization') {
    return (
      <div className="bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t('users:emptyState.organizationRequired')}</h2>
          <p className="text-muted-foreground">{t('users:emptyState.organizationRequiredDescription')}</p>
        </div>
      </div>
    )
  }

  if (type === 'error') {
    return (
      <div className="bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-foreground mb-2">{t('users:emptyState.errorLoading')}</div>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }

  return null
}