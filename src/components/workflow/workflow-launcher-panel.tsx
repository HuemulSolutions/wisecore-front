import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, Loader2, RefreshCw, Search, Share2, X } from "lucide-react"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { HighlightedText } from "@/components/ui/highlighted-text"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulSearchClearButton } from "@/huemul/components/huemul-search-clear-button"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowLauncherPanelProps {
  /** Página vigente del catálogo, ya filtrada y paginada por el backend. */
  items: WorkflowTemplateItem[]
  page: number
  /** Tamaño de página que reportó el backend. */
  pageSize?: number
  onPageChange: (page: number) => void
  hasNext: boolean
  /** El backend no siempre lo envía; sin él no hay contadores ni saltos a página. */
  total?: number
  /** Texto en edición del buscador (no viaja al backend hasta `Enter`). */
  query: string
  onQueryChange: (query: string) => void
  /** `Enter` en el buscador: aplica la búsqueda. */
  onSubmitQuery: () => void
  onClearSearch: () => void
  /** Búsqueda vigente, la que produjo este listado. */
  appliedQuery: string
  hasQuery: boolean
  isLoading: boolean
  error: unknown
  onRetry: () => void
  /** Recarga la query del launcher: un solo botón por superficie. */
  onRefresh: () => void
  isRefreshing: boolean
  startingTemplateId: string | null
  onStart: (item: WorkflowTemplateItem) => void
  onShare: (item: WorkflowTemplateItem) => void
  onClose: () => void
  searchRef: React.RefObject<HTMLInputElement | null>
}

// El mismo template aparece una vez por relación: el id solo no identifica la
// fila y las keys repetidas hacen que React arrastre nodos entre páginas.
function rowKey(item: WorkflowTemplateItem): string {
  return `${item.id}-${item.document_type_id}-${item.relation_name ?? ""}`
}

function StartButtonContent({ isStarting, label }: { isStarting: boolean; label: string }) {
  return isStarting ? (
    <Loader2 className="size-3 animate-spin" />
  ) : (
    <>
      {label}
      <ChevronRight className="size-3" />
    </>
  )
}

function ShareIconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-5.5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:cursor-pointer hover:bg-muted"
    >
      <Share2 className="size-3" />
    </button>
  )
}

function TemplateRow({
  item,
  query,
  isStarting,
  onStart,
  onShare,
  buttonRef,
}: {
  item: WorkflowTemplateItem
  query: string
  isStarting: boolean
  onStart: (item: WorkflowTemplateItem) => void
  onShare: (item: WorkflowTemplateItem) => void
  buttonRef: (el: HTMLButtonElement | null) => void
}) {
  const { t } = useTranslation("workflow")
  const title = item.relation_name || item.name
  const color = item.document_type_color || "#CBD5E1"
  // El título ya es la relación: repetir el nombre del template solo aporta
  // cuando difiere.
  const templateName = title === item.name ? null : item.name

  const meta = [
    item.require_name_on_express ? t("launcher.requiresName") : null,
    item.updated_at ? t("launcher.updatedAt", { when: formatRelativeTime(item.updated_at) }) : null,
  ].filter((entry): entry is string => !!entry)

  return (
    <div className="flex items-start gap-2 rounded-lg px-1.5 py-1.5 opacity-70 transition-opacity hover:opacity-100 focus-within:opacity-100">
      <span className="mt-0.5 h-9 w-0.75 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="min-w-0 flex-1">
        <HighlightedText
          text={title}
          term={query}
          className="block truncate text-[13px] font-medium text-foreground"
        />
        <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
          {templateName && <span className="truncate">{templateName}</span>}
          {templateName && item.document_type_name && <span aria-hidden="true">·</span>}
          {item.document_type_name && (
            <span className="flex min-w-0 items-center gap-1">
              <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="truncate">{item.document_type_name}</span>
            </span>
          )}
        </p>
        {item.description && (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={item.description}>
            {item.description}
          </p>
        )}
        {meta.length > 0 && (
          <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground/70">{meta.join(" · ")}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <ShareIconButton label={t("launcher.shareTemplate", { name: title })} onClick={() => onShare(item)} />
        <button
          ref={buttonRef}
          type="button"
          disabled={isStarting}
          onClick={() => onStart(item)}
          aria-label={`${t("launcher.start")} ${title}`}
          className="flex h-7 shrink-0 items-center gap-0.5 rounded-lg bg-accent px-2.25 text-[12px] font-semibold text-accent-foreground transition-colors hover:cursor-pointer disabled:cursor-default disabled:opacity-70"
        >
          <StartButtonContent isStarting={isStarting} label={t("launcher.start")} />
        </button>
      </div>
    </div>
  )
}

function RowSkeleton() {
  return <div className="h-16 animate-pulse rounded-lg bg-muted" />
}

export function WorkflowLauncherPanel({
  items,
  page,
  pageSize,
  onPageChange,
  hasNext,
  total,
  query,
  onQueryChange,
  onSubmitQuery,
  onClearSearch,
  appliedQuery,
  hasQuery,
  isLoading,
  error,
  onRetry,
  onRefresh,
  isRefreshing,
  startingTemplateId,
  onStart,
  onShare,
  onClose,
  searchRef,
}: WorkflowLauncherPanelProps) {
  const { t } = useTranslation("workflow")
  const { t: tCommon } = useTranslation("common")

  // -1 = foco en el buscador; 0..n-1 = índice sobre los items de la página.
  const [activeIndex, setActiveIndex] = useState(-1)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    setActiveIndex(-1)
    buttonRefs.current = []
  }, [appliedQuery, page])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      const next = Math.min(activeIndex + 1, items.length - 1)
      setActiveIndex(next)
      buttonRefs.current[next]?.focus()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      const next = Math.max(activeIndex - 1, -1)
      setActiveIndex(next)
      if (next === -1) searchRef.current?.focus()
      else buttonRefs.current[next]?.focus()
    } else if (e.key === "Home" && document.activeElement !== searchRef.current) {
      e.preventDefault()
      setActiveIndex(0)
      buttonRefs.current[0]?.focus()
    } else if (e.key === "End" && document.activeElement !== searchRef.current) {
      e.preventDefault()
      const last = items.length - 1
      setActiveIndex(last)
      buttonRefs.current[last]?.focus()
    }
  }

  const showPagination = !isLoading && !error && (hasNext || page > 1)

  return (
    <div className="flex max-h-[70vh] flex-col" onKeyDown={handleKeyDown}>
      <div className="border-b border-border/60 px-4.5 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{t("launcher.panelTitle")}</p>
            {total != null && (
              <p className="text-[11.5px] text-muted-foreground">{t("launcher.panelSubtitle", { count: total })}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <HuemulButton
              variant="ghost"
              size="icon"
              className="size-7.5 rounded-full text-muted-foreground/60 hover:text-foreground"
              icon={RefreshCw}
              iconClassName="size-3.5"
              aria-label={tCommon("refresh")}
              tooltip={tCommon("refresh")}
              loading={isRefreshing}
              onClick={onRefresh}
            />
            <button
              type="button"
              aria-label={t("launcher.close")}
              onClick={onClose}
              className="flex size-7.5 shrink-0 items-center justify-center rounded-full text-muted-foreground/60 hover:cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex h-8.5 max-w-105 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.08)]">
          <Search className="size-3.5 shrink-0 text-muted-foreground/60" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return
              e.preventDefault()
              onSubmitQuery()
            }}
            placeholder={t("launcher.searchPlaceholder")}
            aria-label={t("launcher.searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query.length > 0 && (
            <HuemulSearchClearButton
              onClear={() => {
                onClearSearch()
                searchRef.current?.focus()
              }}
              label={t("launcher.clearSearch")}
            />
          )}
          {total != null && (
            <>
              <span className="h-4 w-px shrink-0 bg-border" />
              <span className="shrink-0 text-[11px] text-muted-foreground" aria-live="polite">
                {t("launcher.resultsCount", { shown: items.length, total })}
              </span>
            </>
          )}
        </div>

      </div>

      <div className="max-h-[min(60vh,520px)] overflow-y-auto p-3.5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-[11px] border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[12.5px] font-medium text-destructive">
            {t("launcher.error")}
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 font-semibold hover:cursor-pointer hover:underline"
            >
              <RefreshCw className="size-3" />
              {t("launcher.retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{hasQuery ? t("launcher.noMatches", { query: appliedQuery }) : t("launcher.empty")}</span>
            {hasQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="font-medium text-accent-foreground hover:cursor-pointer hover:underline"
              >
                {t("launcher.clearSearch")}
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {hasQuery ? t("launcher.matches", { query: appliedQuery }) : t("launcher.rest")}
              </p>
              <p className="shrink-0 text-[11px] text-muted-foreground/70">{t("launcher.keyboardHint")}</p>
            </div>
            {/* key={page}: remonta el grid en cada página, sin arrastrar filas. */}
            <div key={page} className="grid grid-cols-2 gap-x-3 gap-y-1">
              {items.map((item, i) => (
                <TemplateRow
                  key={rowKey(item)}
                  item={item}
                  query={appliedQuery}
                  isStarting={startingTemplateId === item.id}
                  onStart={onStart}
                  onShare={onShare}
                  buttonRef={(el) => {
                    buttonRefs.current[i] = el
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showPagination && (
        <div className="shrink-0 border-t border-border/60 px-4.5 py-2.5">
          <HuemulPagination
            variant="bare"
            page={page}
            pageSize={pageSize ?? items.length}
            totalItems={total}
            hasNext={hasNext}
            hasPrevious={page > 1}
            onPageChange={onPageChange}
            showFirstLast={total != null}
          />
        </div>
      )}
    </div>
  )
}
