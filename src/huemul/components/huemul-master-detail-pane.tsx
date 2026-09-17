import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulTruncatedText } from "@/huemul/components/huemul-truncated-text"
import { HuemulInitialsAvatar } from "@/huemul/components/huemul-initials-avatar"
import type { HuemulMasterDetailPaneProps, HuemulMasterDetailRow } from "@/types/huemul"
export type { HuemulMasterDetailPaneProps, HuemulMasterDetailRow, HuemulMasterDetailState } from "@/types/huemul"

/**
 * Layout maestro-detalle de un historial: columna angosta de filas
 * seleccionables a la izquierda, panel de detalle a la derecha. Sin dominio:
 * recibe filas ya normalizadas y todo el texto por props — igual que
 * `HuemulDetailSurface`, del que es vecino (se monta dentro de uno de sus
 * tabs, a borde completo).
 *
 * Segundo consumidor fuera del sheet de historial: `asset-version-compare-sheet.tsx`
 * repite el mismo split lista+detalle a mano — queda como deuda migrarlo.
 */
export function HuemulMasterDetailPane({
  state,
  listLabel,
  listFilter,
  rows,
  selectedId,
  onSelect,
  listCountLabel,
  loadMore,
  emptyState,
  errorState,
  skeletonRows = 6,
  listWidthClassName = "w-[262px]",
  detailHeader,
  detail,
  detailPlaceholder,
  className,
}: HuemulMasterDetailPaneProps) {
  if (state === "error") {
    return <div className={cn("flex h-full min-h-0 w-full min-w-0 border-t border-[#e8ecf2]", className)}>{errorState}</div>
  }

  return (
    // `w-full`: mismo fix que `HuemulGroupedFeed` — hijo único de `TabsContent`
    // cuando el tab está activo, sin ancho explícito se encoge a su contenido.
    <div className={cn("flex h-full min-h-0 w-full min-w-0 border-t border-[#e8ecf2]", className)}>
      <aside className={cn("flex shrink-0 flex-col border-r border-[#e8ecf2] bg-white", listWidthClassName)}>
        <div className="flex flex-col gap-2 border-b border-[#e8ecf2] px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{listLabel}</p>
          {listFilter}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {state === "loading" && <RowsSkeleton count={skeletonRows} />}
          {state === "empty" && emptyState}
          {state !== "loading" && state !== "empty" &&
            rows.map((row) => (
              <RowItem key={row.id} row={row} isSelected={row.id === selectedId} onClick={() => onSelect(row.id)} />
            ))}
        </div>

        {(listCountLabel || loadMore) && (
          <div className="flex items-center justify-between gap-2 border-t border-[#e8ecf2] px-3 py-2">
            {listCountLabel && <span className="text-[11px] text-[#64748b]">{listCountLabel}</span>}
            {loadMore && (
              <button
                type="button"
                onClick={loadMore.onClick}
                disabled={loadMore.loading}
                className="text-[11px] font-medium text-[#2563eb] hover:cursor-pointer hover:text-[#1d4ed8] disabled:cursor-default disabled:opacity-50"
              >
                {loadMore.loading ? "…" : loadMore.label}
              </button>
            )}
          </div>
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-white">
        {detailHeader}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {state === "loading" ? <DetailSkeleton /> : detail ?? detailPlaceholder}
        </div>
      </section>
    </div>
  )
}

// ── Fila ─────────────────────────────────────────────────────────────────

function RowItem({
  row,
  isSelected,
  onClick,
}: {
  row: HuemulMasterDetailRow
  isSelected: boolean
  onClick: () => void
}) {
  const Icon = row.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-2 border-l-[3px] px-3 py-2.5 text-left transition-colors hover:cursor-pointer",
        isSelected ? "border-l-[#2563eb] bg-[#eff5ff]" : "border-l-transparent hover:bg-[#f8fafc]",
      )}
    >
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-[#f1f5f9]">
        <Icon className={cn("size-[11px]", row.iconClassName)} />
      </span>

      <div className="min-w-0 flex-1">
        <HuemulTruncatedText as="p" text={row.title} className="text-xs font-medium text-[#0f172a]" />
        {row.context && (
          <HuemulTruncatedText as="p" text={row.context} lines={2} className="mt-0.5 text-[11px] text-[#64748b]" />
        )}
        <div className="mt-1 flex items-center gap-1.5">
          {row.authorName && <HuemulInitialsAvatar name={row.authorName} size={18} />}
          {row.authorName && <span className="truncate text-[11px] text-[#64748b]">{row.authorName}</span>}
          {row.timeLabel && (
            <>
              {row.authorName && <span className="text-[11px] text-[#cbd5e1]">·</span>}
              <span className="shrink-0 text-[11px] text-[#94a3b8]">{row.timeLabel}</span>
            </>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Skeletons ────────────────────────────────────────────────────────────

function RowsSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-1 py-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-2 px-3 py-2.5">
          <Skeleton className="mt-0.5 size-4 shrink-0 rounded-[4px]" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-32 rounded" />
            <Skeleton className="h-2.5 w-40 rounded" />
            <Skeleton className="h-2.5 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-4 w-40 rounded" />
      <Skeleton className="h-20 w-full rounded" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded" />
        <Skeleton className="h-32 rounded" />
      </div>
    </div>
  )
}
