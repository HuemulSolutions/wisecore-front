import { ShieldAlert, Building2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface OrganizationPageEmptyStateProps {
  type: "access-denied" | "no-organization"
}

export function OrganizationPageEmptyState({ type }: OrganizationPageEmptyStateProps) {
  const { t } = useTranslation('organizations')

  if (type === "access-denied") {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-6">
        <div className="text-center max-w-md">
          <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('emptyState.accessDenied')}</h2>
          <p className="text-muted-foreground">
            {t('emptyState.accessDeniedDescription')}
          </p>
        </div>
      </div>
    )
  }

  if (type === "no-organization") {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Building2 className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('emptyState.noOrgSelected')}</h2>
          <p className="text-muted-foreground">
            {t('emptyState.noOrgSelectedDescription')}
          </p>
        </div>
      </div>
    )
  }

  return null
}
