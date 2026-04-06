import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Plus, Shield } from "lucide-react"

interface RolesEmptyStateProps {
  hasSearchTerm: boolean
  onCreateRole: () => void
}

export default function RolesEmptyState({ hasSearchTerm, onCreateRole }: RolesEmptyStateProps) {
  const { t } = useTranslation('roles')
  return (
    <div className="text-center py-4 sm:py-6 lg:py-8">
      <Shield className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-muted-foreground mb-2 sm:mb-3" />
      <h3 className="text-sm sm:text-base font-medium text-foreground mb-1 sm:mb-2">{t('emptyState.noRolesFound')}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 px-2">
        {hasSearchTerm
          ? t('emptyState.adjustSearch')
          : t('emptyState.noRolesCreated')}
      </p>
      {!hasSearchTerm && (
        <Button
          onClick={onCreateRole}
          className="hover:cursor-pointer text-xs sm:text-sm"
          size="sm"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          {t('emptyState.createFirst')}
        </Button>
      )}
    </div>
  )
}