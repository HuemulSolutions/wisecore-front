import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { RefreshCw, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrganization } from "@/contexts/organization-context"
import { useDebounce } from "@/hooks/use-debounce"
import { useWorkflowTemplateCatalog } from "@/hooks/useWorkflowTemplateCatalog"
import { sortLaunchTemplates, templateKey, templateTitle } from "@/lib/launcher-templates"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulSearchClearButton } from "@/huemul/components/huemul-search-clear-button"
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text"
import { DEFAULT_TEMPLATE_COLOR, TemplateColorDot, TemplateShareButton, TemplateStartButton } from "./workflow-template-card"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowLauncherDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  startingTemplateId: string | null
  onStart: (item: WorkflowTemplateItem) => void
  onShare: (item: WorkflowTemplateItem) => void
}

const SEARCH_DEBOUNCE_MS = 350

/**
 * Catálogo completo de templates iniciables. Búsqueda (debounce) y paginación
 * server-side; «Cargar más» agrega la página siguiente a la lista.
 */
export function WorkflowLauncherDialog({ open, onOpenChange, startingTemplateId, onStart, onShare }: WorkflowLauncherDialogProps) {
  const { t } = useTranslation("workflow")
  const { t: tCommon } = useTranslation("common")
  const { selectedOrganizationId, organizationToken } = useOrganization()

  const [query, setQuery] = useState("")
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)
  const appliedQuery = debouncedQuery.trim()

  // Cerrar el diálogo descarta la búsqueda: al reabrir arranca desde cero.
  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  const catalog = useWorkflowTemplateCatalog(selectedOrganizationId ?? "", {
    search: appliedQuery,
    enabled: open && !!selectedOrganizationId && !!organizationToken,
  })

  const items = useMemo(() => sortLaunchTemplates(catalog.items), [catalog.items])
  // Buscar con datos previos en pantalla no debe parpadear: se muestra el skeleton
  // solo mientras no hay ninguna página cargada para esta búsqueda.
  const isLoading = catalog.isLoading
  const hasError = !!catalog.error && items.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-140 max-h-[90vh] w-150 max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-xl p-0 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.4)] sm:max-w-150"
      >
        <div className="flex flex-col gap-3 border-b border-border px-5 pt-4.5 pb-3.5">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base leading-normal">{t("launcher.dialogTitle")}</DialogTitle>
            <DialogDescription className="sr-only">{t("launcher.title")}</DialogDescription>
            <div className="flex shrink-0 items-center gap-0.5">
              <HuemulButton
                variant="ghost"
                size="icon"
                className="size-7.5 rounded-md text-muted-foreground"
                icon={RefreshCw}
                iconClassName="size-4"
                aria-label={tCommon("refresh")}
                tooltip={tCommon("refresh")}
                loading={catalog.isFetching && !catalog.isFetchingNextPage}
                onClick={() => catalog.refetch()}
              />
              <button
                type="button"
                aria-label={t("launcher.close")}
                title={t("launcher.close")}
                onClick={() => onOpenChange(false)}
                className="flex size-7.5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:cursor-pointer hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex h-9.5 items-center gap-2 rounded-lg border border-border bg-background pl-3 pr-2 focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15">
            <Search className="size-3.75 shrink-0 text-muted-foreground/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("launcher.searchPlaceholder")}
              aria-label={t("launcher.searchPlaceholder")}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
            />
            {query.length > 0 && (
              <HuemulSearchClearButton onClear={() => setQuery("")} label={t("launcher.clearSearch")} />
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
          ) : hasError ? (
            <div className="mt-20 flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-semibold text-foreground">{t("launcher.error")}</p>
              <button
                type="button"
                onClick={() => catalog.refetch()}
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-accent-foreground hover:cursor-pointer hover:underline"
              >
                <RefreshCw className="size-3" />
                {t("launcher.retry")}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="mt-20 flex flex-col items-center gap-1 px-6 text-center">
              <p className="text-sm font-semibold text-foreground">
                {appliedQuery ? t("launcher.noResultsTitle", { query: appliedQuery }) : t("launcher.empty")}
              </p>
              {appliedQuery && <p className="text-[12.5px] text-muted-foreground">{t("launcher.noResultsHint")}</p>}
            </div>
          ) : (
            items.map((item) => (
              <TemplateRow
                key={templateKey(item)}
                item={item}
                isStarting={startingTemplateId === item.id}
                onStart={onStart}
                onShare={onShare}
              />
            ))
          )}
        </div>

        {!isLoading && !hasError && items.length > 0 && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3">
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {catalog.total != null
                ? t("launcher.shownOfTotal", { shown: items.length, total: catalog.total })
                : t("launcher.shown", { shown: items.length })}
            </span>
            {catalog.hasNextPage && (
              <HuemulButton
                variant="outline"
                className="h-8 text-[13px] font-medium"
                label={t("launcher.loadMore")}
                loading={catalog.isFetchingNextPage}
                onClick={() => catalog.fetchNextPage()}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface TemplateRowProps {
  item: WorkflowTemplateItem
  isStarting: boolean
  onStart: (item: WorkflowTemplateItem) => void
  onShare: (item: WorkflowTemplateItem) => void
}

function TemplateRow({ item, isStarting, onStart, onShare }: TemplateRowProps) {
  const { t } = useTranslation("workflow")
  const title = templateTitle(item)

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.75 hover:bg-muted/60">
      <TemplateColorDot color={item.document_type_color || DEFAULT_TEMPLATE_COLOR} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <div className="flex min-w-0 items-baseline gap-2">
          <HuemulTruncatedText text={title} className="min-w-0 text-[13.5px] font-semibold text-foreground" />
          {item.document_type_name && (
            <span className="shrink-0 text-xs text-muted-foreground">{item.document_type_name}</span>
          )}
          {item.is_top_pick && (
            <span className="shrink-0 text-[11px] font-semibold text-[#b45309]">{t("launcher.featured")}</span>
          )}
        </div>
        {item.description && (
          <HuemulTruncatedText text={item.description} className="text-[12.5px] text-muted-foreground" />
        )}
      </div>
      <TemplateStartButton
        label={t("launcher.start")}
        ariaLabel={`${t("launcher.start")} ${title}`}
        startingLabel={t("launcher.starting")}
        isStarting={isStarting}
        onClick={() => onStart(item)}
        className="h-7.5 rounded-[7px] border border-border px-3 text-[12.5px] hover:border-[#bfdbfe]"
      />
      <TemplateShareButton
        label={t("launcher.shareTemplate")}
        onClick={() => onShare(item)}
        className={cn("size-7.5 rounded-[7px] border border-border text-foreground/70")}
      />
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-3 py-2.75" aria-hidden="true">
      <span className="size-2 shrink-0 rounded-full bg-muted-foreground/25" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="h-2.75 w-2/5 rounded bg-muted" />
        <span className="h-2.25 w-3/4 rounded bg-muted/70" />
      </div>
      <span className="h-7.5 w-17.5 shrink-0 rounded-[7px] bg-muted" />
    </div>
  )
}
