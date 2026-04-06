import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"

interface AuthTypesEmptyStateProps {
  searchTerm: string
}

export function AuthTypesEmptyState({ searchTerm }: AuthTypesEmptyStateProps) {
  const { t } = useTranslation(['auth-types', 'common'])

  return (
    <Card className="border border-border bg-card overflow-auto max-h-[70vh]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted z-10">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">{t('common:name')}</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">{t('columns.type')}</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">{t('columns.created')}</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">{t('columns.updated')}</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">{t('common:actions')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-3 py-12 text-center text-muted-foreground text-xs">
                {searchTerm ? t('emptyState.noResults') : t('emptyState.empty')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}