import { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { ChevronRight, MoreVertical, RefreshCw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrgPath } from "@/hooks/useOrgRouter"
import { useElementWidth } from "@/hooks/useElementWidth"
import { PopoverTrigger } from "@/components/ui/popover"
import { HuemulSearchClearButton } from "@/huemul/components/huemul-search-clear-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DEFAULT_TEMPLATE_COLOR, TemplateCardShell, TemplateShareButton, TemplateStartButton } from "./workflow-template-card"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowLauncherBarProps {
  items: WorkflowTemplateItem[]
  /** Total del catálogo según el backend; no siempre viene en la respuesta. */
  total?: number
  /** No hay ningún template que mostrar con los criterios actuales. */
  isEmpty: boolean
  isLoading: boolean
  error: unknown
  onRetry: () => void
  /** Texto en edición del buscador (no viaja al backend hasta `Enter`). */
  query: string
  onQueryChange: (query: string) => void
  /** `Enter` en el buscador: aplica la búsqueda. */
  onSubmitQuery: () => void
  /** X del buscador: vacía el texto en edición y la búsqueda aplicada. */
  onClearSearch: () => void
  /** Búsqueda vigente, la que produjo este listado. */
  appliedQuery: string
  hasQuery: boolean
  panelOpen: boolean
  hidden: boolean
  onToggleHidden: () => void
  onStart: (item: WorkflowTemplateItem) => void
  /** Abre el diálogo con el link público del template — nunca crea un activo. */
  onShare: (item: WorkflowTemplateItem) => void
  /** Id del template cuyo express está en vuelo: el chip pasa a spinner y se deshabilita. */
  startingTemplateId: string | null
}

const MICROLABEL_CLASSNAME = "select-none text-[11px] font-bold uppercase tracking-[.08em] text-muted-foreground"

const ROOT_CLASSNAME =
  "flex shrink-0 flex-col gap-2.25 border-t border-border/60 border-b border-border bg-muted/40 px-4.5 pt-2.75 pb-3.25 shadow-[0_2px_4px_rgba(15,23,42,0.04)]"

// Ancho fijo de cada tarjeta-chip (`w-60`) — todas iguales, sin importar el
// largo del título. Con el gap del riel (`gap-2`) se calcula cuántas caben.
const RAIL_CARD_WIDTH_PX = 240
const RAIL_CARD_GAP_PX = 8
// Antes de la primera medición del ResizeObserver (width === 0): evita que el
// riel se vea vacío en el primer render.
const RAIL_FALLBACK_COUNT = 6

export const WorkflowLauncherBar = forwardRef<HTMLDivElement, WorkflowLauncherBarProps>(
  function WorkflowLauncherBar(
    {
      items,
      total,
      isEmpty,
      isLoading,
      error,
      onRetry,
      query,
      onQueryChange,
      onSubmitQuery,
      onClearSearch,
      appliedQuery,
      hasQuery,
      panelOpen,
      hidden,
      onToggleHidden,
      onStart,
      onShare,
      startingTemplateId,
    },
    ref,
  ) {
    const { t } = useTranslation("workflow")
    const buildOrgPath = useOrgPath()

    // Cuántas tarjetas de ancho fijo caben en el riel según su ancho medido.
    // `+ 1`: deja entrar la tarjeta que la máscara de fade corta a la mitad,
    // que es la señal visual de que hay más templates.
    const { ref: railRef, width: railWidth } = useElementWidth<HTMLDivElement>()
    const visibleCount =
      railWidth > 0
        ? Math.max(1, Math.floor((railWidth + RAIL_CARD_GAP_PX) / (RAIL_CARD_WIDTH_PX + RAIL_CARD_GAP_PX)) + 1)
        : RAIL_FALLBACK_COUNT
    const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount])

    // Roving tabindex sobre el riel de chips: el `role="toolbar"` declarado
    // exige que las flechas muevan el foco entre chips (contrato ARIA de
    // toolbar); dentro del chip activo, `Tab` alcanza también "Compartir"
    // porque ambos botones comparten tabIndex 0 mientras está activo.
    const [activeChipIndex, setActiveChipIndex] = useState(0)
    const startRefs = useRef<Array<HTMLButtonElement | null>>([])

    useEffect(() => {
      setActiveChipIndex((prev) => Math.min(prev, Math.max(visibleItems.length - 1, 0)))
    }, [visibleItems.length])

    const handleRailKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (visibleItems.length === 0) return
      let nextIndex = activeChipIndex
      if (e.key === "ArrowRight") {
        e.preventDefault()
        nextIndex = Math.min(activeChipIndex + 1, visibleItems.length - 1)
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        nextIndex = Math.max(activeChipIndex - 1, 0)
      } else if (e.key === "Home") {
        e.preventDefault()
        nextIndex = 0
      } else if (e.key === "End") {
        e.preventDefault()
        nextIndex = visibleItems.length - 1
      } else {
        return
      }
      setActiveChipIndex(nextIndex)
      startRefs.current[nextIndex]?.focus()
    }

    if (hidden) {
      return (
        <div ref={ref} className={cn(ROOT_CLASSNAME, "flex-row items-center gap-2")}>
          <p className={MICROLABEL_CLASSNAME}>{t("launcher.title")}</p>
          <button
            type="button"
            onClick={onToggleHidden}
            className="ml-auto text-xs font-medium text-muted-foreground hover:cursor-pointer hover:text-foreground transition-colors"
          >
            {t("launcher.show")}
          </button>
        </div>
      )
    }

    // Solo la línea 2 varía entre estados: la línea 1 (rótulo + buscador +
    // "Ver todos") se apaga cuando no hay nada que buscar/abrir, pero el alto
    // de la banda no cambia (criterio: la tabla no debe saltar). Con búsqueda
    // activa el buscador sigue disponible aunque no haya coincidencias.
    const canBrowse = !isLoading && !error && (!isEmpty || hasQuery)

    return (
      <div ref={ref} className={ROOT_CLASSNAME}>
        {/* Línea 1 */}
        <div className="flex items-center gap-2">
          <p className={cn(MICROLABEL_CLASSNAME, "shrink-0")}>{t("launcher.title")}</p>
          {canBrowse && total != null && (
            <p className="shrink-0 text-xs text-muted-foreground">{t("launcher.available", { count: total })}</p>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            {canBrowse && (
              <>
                <div className="flex h-8 w-58 shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5">
                  <Search className="size-3 shrink-0 text-muted-foreground/60" />
                  <input
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return
                      e.preventDefault()
                      onSubmitQuery()
                    }}
                    placeholder={t("launcher.searchPlaceholder")}
                    aria-label={t("launcher.searchPlaceholder")}
                    className="min-w-0 flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                  {query.length > 0 && (
                    <HuemulSearchClearButton
                      onClear={onClearSearch}
                      label={t("launcher.clearSearch")}
                      iconClassName="size-3"
                    />
                  )}
                </div>

                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-expanded={panelOpen}
                    className={cn(
                      "flex h-8 shrink-0 items-center gap-1 rounded-lg border px-3 text-[12.5px] font-semibold transition-colors hover:cursor-pointer",
                      panelOpen
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-muted text-accent-foreground hover:bg-accent",
                    )}
                  >
                    {t("launcher.seeAll")}
                    <ChevronRight className={cn("size-3 transition-transform", panelOpen && "rotate-90")} />
                  </button>
                </PopoverTrigger>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t("launcher.hide")}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:cursor-pointer hover:bg-accent hover:text-foreground"
                >
                  <MoreVertical className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onToggleHidden} className="hover:cursor-pointer">
                  {t("launcher.hide")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Línea 2 — riel de tarjetas-chip */}
        <div
          ref={railRef}
          className="flex h-10 min-w-0 items-center gap-2 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, #000 0, #000 calc(100% - 48px), transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, #000 0, #000 calc(100% - 48px), transparent 100%)",
          }}
          role="toolbar"
          aria-label={t("launcher.title")}
          onKeyDown={handleRailKeyDown}
        >
          {isLoading ? (
            Array.from({ length: visibleCount }).map((_, i) => (
              <span key={i} className="h-10 w-60 shrink-0 animate-pulse rounded-[11px] bg-muted" />
            ))
          ) : error ? (
            <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[11px] border border-destructive/30 bg-destructive/10 px-3 text-[12.5px] font-medium text-destructive">
              {t("launcher.error")}
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 font-semibold hover:cursor-pointer hover:underline"
              >
                <RefreshCw className="size-3" />
                {t("launcher.retry")}
              </button>
            </span>
          ) : hasQuery && items.length === 0 ? (
            <span className="text-xs text-muted-foreground">{t("launcher.noMatches", { query: appliedQuery })}</span>
          ) : isEmpty ? (
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] text-muted-foreground">{t("launcher.empty")}</span>
              <Link
                to={buildOrgPath("/templates")}
                className="text-[12.5px] font-medium text-accent-foreground hover:cursor-pointer hover:underline"
              >
                {t("launcher.createTemplate")}
              </Link>
            </div>
          ) : (
            visibleItems.map((item, i) => {
              const isStarting = startingTemplateId === item.id
              const title = item.relation_name || item.name
              return (
                <TemplateCardShell
                  // El mismo template se repite por relación: el id solo no
                  // identifica el chip.
                  key={`${item.id}-${item.document_type_id}-${item.relation_name ?? ""}`}
                  color={item.document_type_color || DEFAULT_TEMPLATE_COLOR}
                  className="h-10 w-60 shrink-0 items-center gap-2 pr-2"
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground" title={title}>
                    {title}
                  </span>
                  <TemplateShareButton
                    label={t("launcher.shareTemplate", { name: title })}
                    onClick={() => onShare(item)}
                    tabIndex={i === activeChipIndex ? 0 : -1}
                    onFocus={() => setActiveChipIndex(i)}
                  />
                  <TemplateStartButton
                    label={t("launcher.start")}
                    ariaLabel={`${t("launcher.start")} ${title}`}
                    isStarting={isStarting}
                    onClick={() => onStart(item)}
                    buttonRef={(el) => {
                      startRefs.current[i] = el
                    }}
                    tabIndex={i === activeChipIndex ? 0 : -1}
                    onFocus={() => setActiveChipIndex(i)}
                  />
                </TemplateCardShell>
              )
            })
          )}
        </div>
      </div>
    )
  },
)
