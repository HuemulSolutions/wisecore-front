"use client"

import { Card } from "@/components/ui/card"
import { Plus, RefreshCw, Settings2 } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { useTranslation } from "react-i18next"
import type { CustomFieldContentEmptyStateProps } from '@/types/custom-fields'

export type { CustomFieldContentEmptyStateProps } from '@/types/custom-fields'

export function CustomFieldContentEmptyState({
  type,
  message,
  onRetry,
  onCreateFirst,
}: CustomFieldContentEmptyStateProps) {
  const { t } = useTranslation(['custom-fields', 'common'])

  if (type === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
        <p className="text-red-600 mb-4 font-medium">
          {message || t('custom-fields:contentEmptyState.errorTitle')}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          {t('custom-fields:contentEmptyState.errorDescription')}
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

  // type === "empty"
  return (
    <Card className="p-8 text-center">
      <Settings2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{t('custom-fields:contentEmptyState.emptyTitle')}</h3>
      <p className="text-muted-foreground">
        {t('custom-fields:contentEmptyState.emptyDescription')}
      </p>
      {onCreateFirst && (
        <HuemulButton
          onClick={onCreateFirst}
          icon={Plus}
          label={t('custom-fields:actions.createFirstCustomField')}
          className="mt-4"
        />
      )}
    </Card>
  )
}
