import { useTranslation } from "react-i18next"
import { HuemulAccessDenied } from "@/huemul/components/huemul-access-denied"
import type { AssetTypePageEmptyStateProps } from '@/types/assets'

export type { AssetTypePageEmptyStateProps } from '@/types/assets'

export default function AssetTypePageEmptyState({ type, message }: AssetTypePageEmptyStateProps) {
  const { t } = useTranslation(['asset-types', 'common'])

  if (type === 'access-denied') {
    return <HuemulAccessDenied description={t('accessDenied.description')} />
  }

  if (type === 'error') {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-bold text-foreground mb-2">{t('errorState.errorTitle')}</div>
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    )
  }

  return null
}
