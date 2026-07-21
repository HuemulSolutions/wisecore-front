"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Workflow, Search } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { useTranslation } from "react-i18next"

export interface DiagramsContentEmptyStateProps {
  type: "error" | "empty" | "no-results"
  message?: string
  onRetry?: () => void
  onClearFilters?: () => void
}

export function DiagramsContentEmptyState({
  type,
  message,
  onRetry,
  onClearFilters,
}: DiagramsContentEmptyStateProps) {
  const { t } = useTranslation(['diagrams', 'common'])

  if (type === "error") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium">{t('contentEmptyState.errorTitle')}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {message || t('contentEmptyState.errorDescription')}
          </p>
          {onRetry && (
            <HuemulButton
              onClick={onRetry}
              variant="outline"
              icon={RefreshCw}
              label={t('common:tryAgain', 'Try Again')}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>
    )
  }

  if (type === "no-results") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Search className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium">{t('contentEmptyState.noResultsTitle')}</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {t('contentEmptyState.noResultsDescription')}
          </p>
          {onClearFilters && (
            <HuemulButton
              onClick={onClearFilters}
              variant="outline"
              label={t('actions.clearFilters')}
              className="mt-4"
            />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Workflow className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="mt-4 text-lg font-medium">{t('contentEmptyState.emptyTitle')}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {t('contentEmptyState.emptyDescription')}
        </p>
      </CardContent>
    </Card>
  )
}
