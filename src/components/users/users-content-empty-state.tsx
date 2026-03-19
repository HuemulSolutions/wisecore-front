import { Users, RefreshCw } from "lucide-react"
import { useTranslation } from 'react-i18next'
import { HuemulButton } from "@/huemul/components/huemul-button"
import { Card } from "@/components/ui/card"

interface UserContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
}

export function UserContentEmptyState({ type, message, onRetry }: UserContentEmptyStateProps) {
  const { t } = useTranslation(['users', 'common'])

  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
        <p className="text-red-600 mb-4 font-medium">{message || t('users:emptyState.failedToLoad')}</p>
        <p className="text-sm text-muted-foreground mb-6">
          {t('users:emptyState.errorDescription')}
        </p>
        {onRetry && (
          <HuemulButton
            label={t('common:tryAgain')}
            icon={RefreshCw}
            onClick={onRetry}
            variant="outline"
          />
        )}
      </div>
    )
  }

  // Empty state
  return (
    <Card className="p-8 text-center">
      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{t('users:emptyState.title')}</h3>
      <p className="text-muted-foreground">
        {t('users:emptyState.noMatch')}
      </p>
    </Card>
  )
}