import { useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp, RefreshCw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useElementWidth } from "@/hooks/useElementWidth"
import { sortLaunchTemplates, templateKey, templateTitle } from "@/lib/launcher-templates"
import { HuemulSearchClearButton } from "@/huemul/components/huemul-search-clear-button"
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text"
import { DEFAULT_TEMPLATE_COLOR, TemplateColorDot, TemplateShareButton, TemplateStartButton } from "./workflow-template-card"
import type { WorkflowTemplateItem } from "@/types/templates"

interface WorkflowLauncherBarProps {
  items: WorkflowTemplateItem[]
  /** Total del catálogo según el backend; no siempre viene en la respuesta. */
  total?: number
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
  hidden: boolean
  onToggleHidden: () => void
  onSeeAll: () => void
  onStart: (item: WorkflowTemplateItem) => void
  /** Copia el link de template — nunca crea un activo. */
  onShare: (item: WorkflowTemplateItem) => void
  /** Id del template cuyo express está en vuelo: el chip pasa a «Creando…» y se deshabilita. */
  startingTemplateId: string | null
}

const MICROLABEL_CLASSNAME = "select-none text-[11px] font-semibold uppercase tracking-[.08em] text-muted-foreground"

const ROOT_CLASSNAME = "relative flex shrink-0 flex-col gap-3 border-b border-border bg-muted/60 px-4 pt-3.5 pb-4"

// Espacio entre chips, igual al `gap-2.5` del riel.
const CHIP_GAP_PX = 10
// Antes de la primera medición (ancho del riel aún 0) se muestran unos pocos
// para no ver la fila vacía; el layout effect re-mide antes del primer paint.
const FALLBACK_COUNT = 4

const SKELETON_WIDTHS = [200, 240, 180, 220]

// Desde este largo el título ocupa 2 líneas en el chip y baja de tamaño para
// que el bloque entre con aire en los 40px de alto.
const LONG_TITLE_CHARS = 28

export function WorkflowLauncherBar({
  items,
  total,
  isLoading,
  error,
  onRetry,
  query,
  onQueryChange,
  onSubmitQuery,
  onClearSearch,
  appliedQuery,
  hasQuery,
  hidden,
  onToggleHidden,
  onSeeAll,
  onStart,
  onShare,
  startingTemplateId,
}: WorkflowLauncherBarProps) {
  const { t } = useTranslation("workflow")

  const sorted = useMemo(() => sortLaunchTemplates(items), [items])
  const isEmpty = !isLoading && !error && sorted.length === 0

  // Cuántos chips entran completos en el riel según su ancho medido. Los chips
  // tienen ancho natural (los nombres varían), así que se miden en una réplica
  // invisible y se acumulan contra el ancho del riel. `measureNode` es un
  // callback ref en estado: la medición se repite cada vez que la réplica se
  // monta (franja que se expande, fin de la carga), no solo al cambiar `sorted`.
  // `useElementWidth` observa el riel, así que al abrir el panel lateral baja la
  // cantidad. Un chip que no entra entero no se renderiza.
  const { ref: railRef, width: railWidth } = useElementWidth<HTMLDivElement>()
  const [measureNode, setMeasureNode] = useState<HTMLDivElement | null>(null)
  const [chipWidths, setChipWidths] = useState<number[]>([])

  useLayoutEffect(() => {
    if (!measureNode) return
    setChipWidths(Array.from(measureNode.children).map((child) => (child as HTMLElement).getBoundingClientRect().width))
  }, [measureNode, sorted])

  const visibleCount = useMemo(() => {
    if (railWidth === 0 || chipWidths.length !== sorted.length) return Math.min(FALLBACK_COUNT, sorted.length)
    let used = 0
    let count = 0
    for (const width of chipWidths) {
      const next = used + width + (count > 0 ? CHIP_GAP_PX : 0)
      if (next > railWidth) break
      used = next
      count += 1
    }
    return Math.max(1, count)
  }, [railWidth, chipWidths, sorted.length])

  const visibleItems = sorted.slice(0, visibleCount)

  // «Ver todos» y el buscador solo tienen sentido con algo que buscar/abrir;
  // con búsqueda activa siguen disponibles aunque no haya coincidencias.
  const canBrowse = !isLoading && !error && (!isEmpty || hasQuery)

  return (
    <div className={cn(ROOT_CLASSNAME, hidden && "py-2.5")}>
      <div className="flex items-center gap-2">
        <p className={cn(MICROLABEL_CLASSNAME, "shrink-0")}>{t("launcher.title")}</p>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {!hidden && canBrowse && (
            <>
              <div className="flex h-8 w-58 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-2.5">
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

              <button
                type="button"
                onClick={onSeeAll}
                className="flex h-8 shrink-0 items-center rounded-lg border border-border bg-background px-3 text-[12.5px] font-semibold text-foreground transition-colors hover:cursor-pointer hover:bg-accent"
              >
                {total != null ? t("launcher.seeAllWithTotal", { total }) : t("launcher.seeAll")}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onToggleHidden}
            aria-label={hidden ? t("launcher.show") : t("launcher.hide")}
            aria-expanded={!hidden}
            title={hidden ? t("launcher.show") : t("launcher.hide")}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:cursor-pointer hover:bg-accent hover:text-foreground"
          >
            {hidden ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </button>
        </div>
      </div>

      {!hidden && (
        <div ref={railRef} className="flex h-10 min-w-0 items-center gap-2.5 overflow-hidden whitespace-nowrap">
          {isLoading ? (
            SKELETON_WIDTHS.map((width, i) => (
              <span
                key={i}
                style={{ width }}
                className="h-10 shrink-0 animate-pulse rounded-full bg-muted"
                aria-hidden="true"
              />
            ))
          ) : error ? (
            <span className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
              {t("launcher.error")}
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 font-semibold text-accent-foreground hover:cursor-pointer hover:underline"
              >
                <RefreshCw className="size-3" />
                {t("launcher.retry")}
              </button>
            </span>
          ) : hasQuery && sorted.length === 0 ? (
            <span className="text-xs text-muted-foreground">{t("launcher.noMatches", { query: appliedQuery })}</span>
          ) : isEmpty ? (
            <span className="text-[12.5px] text-muted-foreground">{t("launcher.empty")}</span>
          ) : (
            visibleItems.map((item) => (
              <LauncherChip
                key={templateKey(item)}
                item={item}
                isStarting={startingTemplateId === item.id}
                onStart={onStart}
                onShare={onShare}
              />
            ))
          )}
        </div>
      )}

      {/* Réplica invisible de todos los chips, solo para medir su ancho natural. */}
      {!hidden && !isLoading && !error && sorted.length > 0 && (
        <div
          ref={setMeasureNode}
          aria-hidden="true"
          className="pointer-events-none invisible absolute -z-10 flex h-0 gap-2.5 overflow-hidden whitespace-nowrap"
        >
          {sorted.map((item) => (
            <LauncherChip key={templateKey(item)} item={item} isStarting={false} onStart={onStart} onShare={onShare} inert />
          ))}
        </div>
      )}
    </div>
  )
}

interface LauncherChipProps {
  item: WorkflowTemplateItem
  isStarting: boolean
  onStart: (item: WorkflowTemplateItem) => void
  onShare: (item: WorkflowTemplateItem) => void
  /** Réplica de medición: sin foco ni interacción. */
  inert?: boolean
}

// Chip de tres zonas separadas por líneas verticales: nombre (no clickeable),
// «Iniciar ›» y compartir.
function LauncherChip({ item, isStarting, onStart, onShare, inert }: LauncherChipProps) {
  const { t } = useTranslation("workflow")
  const title = templateTitle(item)
  const isLongTitle = title.length > LONG_TITLE_CHARS

  return (
    <div
      {...(inert ? { inert: true } : {})}
      className="inline-flex h-10 shrink-0 items-center rounded-full border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
    >
      <div className="flex min-w-0 items-center gap-2 pr-3 pl-3.5">
        <TemplateColorDot color={item.document_type_color || DEFAULT_TEMPLATE_COLOR} />
        <HuemulTruncatedText
          text={title}
          lines={2}
          className={cn(
            "max-w-56 whitespace-normal break-words font-semibold text-foreground",
            isLongTitle ? "text-xs leading-[1.25]" : "text-[13.5px] leading-[1.2]",
          )}
        />
      </div>
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border" />
      <TemplateStartButton
        label={t("launcher.start")}
        ariaLabel={`${t("launcher.start")} ${title}`}
        startingLabel={t("launcher.starting")}
        isStarting={isStarting}
        onClick={() => onStart(item)}
        className="h-9.5 px-3 text-[12.5px]"
      />
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border" />
      <TemplateShareButton
        label={t("launcher.shareTemplate")}
        onClick={() => onShare(item)}
        className="h-9.5 w-10 rounded-r-full"
      />
    </div>
  )
}
