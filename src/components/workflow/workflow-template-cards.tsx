import { LayoutTemplate } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowTemplateCardsProps {
  items: WorkflowTemplateItem[]
  isLoading?: boolean
  onStart: (item: WorkflowTemplateItem) => void
}

// Ciclo de colores para el icono de cada tarjeta — el backend no entrega un
// icono/color por template, asi que se asigna por posicion para dar variedad
// visual sin inventar datos.
const ICON_COLORS = [
  "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
]

export function WorkflowTemplateCards({ items, isLoading, onStart }: WorkflowTemplateCardsProps) {
  const { t } = useTranslation("workflow")

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-64 rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {t("availableTemplates.title")}
      </p>
      <div className="flex flex-wrap gap-3">
        {items.map((item, index) => (
          <Card key={item.id} className="w-64 gap-3 py-4">
            <div className="flex flex-col gap-2 px-4">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  ICON_COLORS[index % ICON_COLORS.length],
                )}
              >
                <LayoutTemplate className="h-4.5 w-4.5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{item.name}</p>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              )}
            </div>
            <div className="flex items-center justify-end px-4">
              <Button size="sm" className="hover:cursor-pointer" onClick={() => onStart(item)}>
                {t("availableTemplates.start")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
