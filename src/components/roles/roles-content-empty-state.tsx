import { useTranslation } from "react-i18next"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RolesContentEmptyStateProps {
  error?: any
  onRetry?: () => void
}

export function RolesContentEmptyState({ error, onRetry }: RolesContentEmptyStateProps) {
  const { t } = useTranslation(['roles', 'common'])
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
      <p className="text-red-600 mb-4 font-medium">
        {error?.message || t('roles:errorState.failedToLoad')}
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        {t('roles:errorState.errorDescription')}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="hover:cursor-pointer">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common:tryAgain')}
        </Button>
      )}
    </div>
  )
}
