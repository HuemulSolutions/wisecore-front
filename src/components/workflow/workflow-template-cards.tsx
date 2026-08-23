import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowTemplateCardsProps {
  /**
   * `asset:c` + `template:l|r` — iniciar un template crea un documento real
   * (POST /document_types/{id}/templates/{id}/express). Obligatoria (sin
   * default) para que un call-site futuro no herede un default permisivo.
   */
  canCreate: boolean
  items: WorkflowTemplateItem[]
  isLoading?: boolean
  page: number
  pageSize: number
  hasNext: boolean
  onPageChange: (page: number) => void
  onStart: (item: WorkflowTemplateItem) => void
  /** Abre el diálogo con el link para que otro usuario cree su propio express desde este template. */
  onShare: (item: WorkflowTemplateItem) => void
}

const GRID_CLASSNAME = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

export function WorkflowTemplateCards({
  canCreate,
  items,
  isLoading,
  page,
  pageSize,
  hasNext,
  onPageChange,
  onStart,
  onShare,
}: WorkflowTemplateCardsProps) {
  const { t } = useTranslation("workflow")
  const [visible, setVisible] = useState(true)

  // Las tarjetas existen solo para crear: sin permiso no hay nada que mostrar.
  if (!canCreate) {
    return null
  }

  if (isLoading) {
    return (
      <div className={GRID_CLASSNAME}>
        {Array.from({ length: pageSize }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  }

  if (items.length === 0 && page <= 1) {
    return null
  }

  const showNav = page > 1 || hasNext

  return (
    <section className="flex shrink-0 flex-col gap-2 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {t("availableTemplates.title")}
        </p>

        {visible && showNav && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("availableTemplates.previousPage")}
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums select-none">
              {page}
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("availableTemplates.nextPage")}
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNext}
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:cursor-pointer disabled:opacity-40"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}

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
              key={`${item.id}-${item.document_type_id}`}
              role="button"
              tabIndex={0}
              onClick={() => canCreate && onStart(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  if (canCreate) onStart(item)
                }
              }}
              className="group relative gap-0 overflow-hidden py-0 hover:cursor-pointer hover:border-primary/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 transition-colors"
            >
              <div
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: item.document_type_color || "transparent" }}
              />
              <div className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-center gap-3">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground" title={item.relation_name || item.name}>
                    {item.relation_name || item.name}
                  </p>
                  <button
                    type="button"
                    aria-label={t("share.cardTooltip")}
                    title={t("share.cardTooltip")}
                    onClick={(e) => {
                      e.stopPropagation()
                      onShare(item)
                    }}
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:cursor-pointer hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Share2 className="size-3.5" />
                  </button>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary">
                    {t("availableTemplates.start")}
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                {item.description && (
                  <p className="line-clamp-3 text-xs text-muted-foreground" title={item.description}>
                    {item.description}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}
