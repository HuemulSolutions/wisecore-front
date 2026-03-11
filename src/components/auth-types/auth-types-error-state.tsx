import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulButton } from "@/huemul/components/huemul-button"

interface AuthTypesErrorStateProps {
  error?: any
  onRetry?: () => void
}

export function AuthTypesErrorState({ error, onRetry }: AuthTypesErrorStateProps) {
  const { t } = useTranslation(['auth-types', 'common'])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
      <p className="text-red-600 mb-4 font-medium">
        {error?.message || t('errorState.failedToLoad')}
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        {t('errorState.errorDescription')}
      </p>
      {onRetry && (
        <HuemulButton
          onClick={onRetry}
          variant="outline"
          icon={RefreshCw}
          label={t('common:tryAgain')}
        />
      )}
    </div>
  )
}