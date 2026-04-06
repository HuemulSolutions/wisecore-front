import { Card } from "@/components/ui/card"
import { Settings } from "lucide-react"
import { useTranslation } from "react-i18next"

interface ModelsEmptyStateProps {
  title?: string
  description?: string
}

export function ModelsEmptyState({ 
  title, 
  description,
}: ModelsEmptyStateProps) {
  const { t } = useTranslation('models')

  return (
    <Card className="border border-border bg-card">
      <div className="text-center py-8">
        <Settings className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-sm font-medium text-foreground mb-1">{title || t('emptyState.noProviders')}</h3>
        <p className="text-xs text-muted-foreground">{description || t('emptyState.noProvidersDesc')}</p>
      </div>
    </Card>
  )
}