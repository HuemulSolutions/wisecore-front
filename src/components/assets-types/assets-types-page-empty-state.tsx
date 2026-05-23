import { Package } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { AssetTypePageEmptyStateProps } from "@/types/assets-types-page-empty-state"

export type { AssetTypePageEmptyStateProps } from "@/types/assets-types-page-empty-state"

export default function AssetTypePageEmptyState({ type, message }: AssetTypePageEmptyStateProps) {
  const { t } = useTranslation(['asset-types', 'common'])

  if (type === 'access-denied') {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">{t('common:accessDenied')}</h2>
          <p className="text-muted-foreground">{t('accessDenied.description')}</p>
        </div>
      </div>
    )
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
