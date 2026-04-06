"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert, Plus } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { useTranslation } from "react-i18next"

interface CustomFieldPageEmptyStateProps {
  type: "access-denied" | "error" | "empty"
  message?: string
  onCreateFirst?: () => void
}

export function CustomFieldPageEmptyState({
  type,
  message,
  onCreateFirst,
}: CustomFieldPageEmptyStateProps) {
  const { t } = useTranslation('custom-fields')

  if (type === "access-denied") {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium">{t('emptyState.accessDeniedTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('emptyState.accessDeniedDescription')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (type === "error") {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium">{t('emptyState.errorLoadingTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {message || t('emptyState.errorLoadingDescription')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium">{t('emptyState.emptyTitle')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('emptyState.emptyDescription')}
            </p>
            {onCreateFirst && (
              <HuemulButton
                onClick={onCreateFirst}
                icon={Plus}
                label={t('actions.createFirstCustomField')}
                className="mt-4"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}