import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowTemplateCardsProps {
  items: WorkflowTemplateItem[]
  isLoading?: boolean
  onStart: (item: WorkflowTemplateItem) => void
}

const GRID_CLASSNAME = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

export function WorkflowTemplateCards({ items, isLoading, onStart }: WorkflowTemplateCardsProps) {
  const { t } = useTranslation("workflow")
  const [visible, setVisible] = useState(true)

  if (isLoading) {
    return (
      <div className={GRID_CLASSNAME}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <section className="flex shrink-0 flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t("availableTemplates.title")}
        </p>
        <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs tabular-nums">
          {items.length}
        </Badge>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-expanded={visible}
          className="ml-auto text-xs font-medium text-muted-foreground hover:cursor-pointer hover:text-foreground transition-colors"
        >
          {visible ? t("availableTemplates.hide") : t("availableTemplates.show")}
        </button>
      </div>

      {visible && (
        <div className={GRID_CLASSNAME}>
          {items.map((item) => (
            <Card
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onStart(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onStart(item)
                }
              }}
              className="group gap-0 overflow-hidden py-0 hover:cursor-pointer hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-colors"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground" title={item.name}>
                  {item.name}
                </p>
                <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
                  {t("availableTemplates.start")}
                  <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
