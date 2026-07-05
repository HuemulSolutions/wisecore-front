"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import { useTranslation } from "react-i18next"

export interface DiagramsPageEmptyStateProps {
  type: "access-denied" | "no-organization" | "error"
  message?: string
}

export function DiagramsPageEmptyState({ type, message }: DiagramsPageEmptyStateProps) {
  const { t } = useTranslation(['diagrams', 'common'])

  if (type === "access-denied") {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium">{t('common:accessDenied')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('emptyState.accessDeniedDescription')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (type === "no-organization") {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="mx-auto max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <ShieldAlert className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium">{t('common:noOrganization')}</h3>
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
