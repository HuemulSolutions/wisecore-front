import { useTranslation } from "react-i18next"
import { Shield } from "lucide-react"

export function RolesAccessDenied() {
  const { t } = useTranslation(['roles', 'common'])
  return (
    <div className="bg-background p-2 sm:p-3 md:p-4 lg:p-6 flex items-center justify-center">
      <div className="text-center px-2">
        <Shield className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-2 sm:mb-4" />
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">{t('common:accessDenied')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">{t('roles:accessDenied.description')}</p>
      </div>
    </div>
  )
}
