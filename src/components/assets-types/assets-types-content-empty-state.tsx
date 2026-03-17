import { FileStack, RefreshCw, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Card } from "@/components/ui/card"

interface AssetTypeContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
  onCreateFirst?: () => void
}

export function AssetTypeContentEmptyState({ 
  type, 
  message, 
  onRetry,
  onCreateFirst 
}: AssetTypeContentEmptyStateProps) {
  const { t } = useTranslation(['asset-types', 'common'])

  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
        <p className="text-red-600 mb-4 font-medium">{message || t('errorState.failedToLoad')}</p>
        <p className="text-sm text-muted-foreground mb-6">
          {t('errorState.errorDescription')}
        </p>
        {onRetry && (
          <HuemulButton onClick={onRetry} variant="outline" icon={RefreshCw} label={t('common:tryAgain')} />
        )}
      </div>
    )
  }

  // Empty state
  return (
    <Card className="border border-border bg-card">
      <div className="text-center py-12">
        <FileStack className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">{t('emptyState.noAssetTypesFound')}</h3>
        <p className="text-muted-foreground mb-4">
          {t('emptyState.noAssetTypesCreated')}
        </p>
        {onCreateFirst && (
          <HuemulButton
            size="sm"
            onClick={onCreateFirst}
            className="h-8 px-3"
            icon={Plus}
            label={t('emptyState.createFirst')}
          />
        )}
      </div>
    </Card>
  )
}
