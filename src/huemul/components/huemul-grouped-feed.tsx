import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { HuemulGroupedFeedProps } from "@/types/huemul"
export type { HuemulGroupedFeedProps, HuemulGroupedFeedGroup, HuemulGroupedFeedState } from "@/types/huemul"

/**
 * Columna única scrolleable con encabezados de grupo — la forma narrow del
 * sheet de historial (equivalente de `HuemulMasterDetailPane` sin panel de
 * detalle: acá el "detalle" es la fila misma, expandida en su propio lugar).
 * Sin dominio: recibe `groups[].rows` ya renderizadas y `groups[].label` ya
 * traducido — ver `ia context/detail-surface-guide.md`.
 *
 * Solo la lista scrollea: `contextStrip` y `footer` quedan fijos fuera del
 * área de scroll.
 */
export function HuemulGroupedFeed({
  state,
  contextStrip,
  groups,
  emptyState,
  errorState,
  skeletonRows = 3,
  footer,
  className,
}: HuemulGroupedFeedProps) {
  if (state === "error") {
    return (
      <div className={cn("flex h-full min-h-0 w-full min-w-0 flex-col", className)}>
        {contextStrip}
        <div className="flex min-h-0 flex-1 flex-col border-t border-[#dde3ec]">{errorState}</div>
      </div>
    )
  }

  return (
    // `w-full`: hijo único de `TabsContent` cuando el tab está activo (`display:flex`,
    // fila por defecto) — sin ancho explícito, un flex-item de fila se encoge a su
    // contenido en vez de llenar el sheet, dejando un hueco en blanco a la derecha.
    <div className={cn("flex h-full min-h-0 w-full min-w-0 flex-col", className)}>
      {contextStrip}

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#dde3ec]">
        {state === "loading" && <RowsSkeleton count={skeletonRows} />}
        {state === "empty" && <div className="px-[22px] py-6">{emptyState}</div>}
        {state !== "loading" && state !== "empty" &&
          groups.map((group) => (
            <div key={group.key}>
              <p className="sticky -top-px z-(--z-feed-sticky) border-y border-[#dde3ec] bg-[#eef2f7] px-[22px] py-[7px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">
                {group.label}
              </p>
              {group.rows}
            </div>
          ))}
      </div>

      {footer && (
        <div className="shrink-0 border-t border-[#dde3ec] bg-[#f7f9fc] px-[22px] py-2.5">{footer}</div>
      )}
    </div>
  )
}

function RowsSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-1 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-2.5 px-[22px] py-3">
          <Skeleton className="mt-0.5 size-5 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-40 rounded" />
            <Skeleton className="h-2.5 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
