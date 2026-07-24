import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowTemplateCardsProps {
  items: WorkflowTemplateItem[]
  isLoading?: boolean
  onStart: (item: WorkflowTemplateItem) => void
}

export function WorkflowTemplateCards({ items, isLoading, onStart }: WorkflowTemplateCardsProps) {
  const { t } = useTranslation("workflow")

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-64 shrink-0 rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {t("availableTemplates.title")}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => (
          <Card key={item.id} className="w-64 shrink-0 gap-0 overflow-hidden py-0">
            <div className="flex flex-col gap-2 px-4 pt-4 pb-4">
              <p className="text-sm font-semibold text-foreground">{item.name}</p>
              {item.description && (
                <p className="line-clamp-3 text-xs text-muted-foreground">{item.description}</p>
              )}
              <Button size="sm" className="mt-1 w-full hover:cursor-pointer" onClick={() => onStart(item)}>
                {t("availableTemplates.start")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
