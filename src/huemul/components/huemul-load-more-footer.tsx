import { cn } from "@/lib/utils"

export interface HuemulLoadMoreFooterProps {
  /** "X de Y eventos" / "7 cargados". */
  countLabel: string
  loadMoreLabel: string
  /** `undefined` oculta el botón — no hay página siguiente. */
  onLoadMore?: () => void
  isLoading?: boolean
  className?: string
}

/**
 * Footer fijo "X de Y" + botón "Cargar más" del sheet de historial angosto.
 * Hermano de `HuemulPanelSaveBar`, pero pensado para reemplazar el
 * `footerContent` de `HuemulSheet`: ese slot llega sin wrapper (ver su
 * docblock, "sin el wrapper sticky/borde/padding por defecto"), así que este
 * componente trae el suyo — sticky, borde superior, fondo y padding — en vez
 * de asumir que el sheet se lo da.
 */
export function HuemulLoadMoreFooter({ countLabel, loadMoreLabel, onLoadMore, isLoading, className }: HuemulLoadMoreFooterProps) {
  return (
    <div className={cn("sticky bottom-0 flex w-full items-center justify-between gap-2 border-t border-[#e8ecf2] bg-white px-[22px] py-2.5", className)}>
      <span className="text-[12.5px] text-[#64748b]">{countLabel}</span>
      {onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="flex h-7 items-center rounded-[6px] border border-[#dfe3ea] px-2.5 text-[12px] font-medium text-[#1d4ed8] hover:cursor-pointer hover:bg-[#f8fafc] disabled:cursor-default disabled:opacity-50"
        >
          {isLoading ? "…" : loadMoreLabel}
        </button>
      )}
    </div>
  )
}
