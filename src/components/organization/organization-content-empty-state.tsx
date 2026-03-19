import { Plus, RefreshCw, AlertCircle, Building2 } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { useTranslation } from "react-i18next"

interface OrganizationContentEmptyStateProps {
  type: "empty" | "no-results" | "error"
  onCreateFirst?: () => void
  onClearFilters?: () => void
  onRetry?: () => void
  message?: string
}

export function OrganizationContentEmptyState({
  type,
  onCreateFirst,
  onClearFilters,
  onRetry,
  message
}: OrganizationContentEmptyStateProps) {
  const { t } = useTranslation('organizations')

  if (type === "empty") {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('emptyState.noOrgsYet')}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('emptyState.noOrgsYetDescription')}
        </p>
        {onCreateFirst && (
          <HuemulButton icon={Plus} label={t('header.createOrganization')} onClick={onCreateFirst} />
        )}
      </div>
    )
  }

  if (type === "no-results") {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('emptyState.noOrgsFound')}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('emptyState.noOrgsFoundDescription')}
        </p>
        {onClearFilters && (
          <HuemulButton variant="outline" label={t('emptyState.clearFilters')} onClick={onClearFilters} />
        )}
      </div>
    )
  }

  if (type === "error") {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('emptyState.errorLoading')}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {message || t('emptyState.errorDefault')}
        </p>
        {onRetry && (
          <HuemulButton variant="outline" icon={RefreshCw} label={t('common:tryAgain')} onClick={onRetry} />
        )}
      </div>
    )
  }

  return null
}
