import { cn } from "@/lib/utils"

export interface HuemulTabCountProps {
  label: string
  count: number
  /** Si el tab dueño de este contador está activo — cambia la paleta de la pastilla. */
  active: boolean
  className?: string
}

/**
 * Pastilla de contador para el label de un `HuemulDetailSurfaceTab`
 * (`label` acepta `ReactNode`). Activo: `#dbeafe`/`#1d4ed8`. Inactivo:
 * `#f1f5f9`/`#64748b`.
 */
export function HuemulTabCount({ label, count, active, className }: HuemulTabCountProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {label}
      <span
        className={cn(
          "inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
          active ? "bg-[#dbeafe] text-[#1d4ed8]" : "bg-[#f1f5f9] text-[#64748b]",
        )}
      >
        {count}
      </span>
    </span>
  )
}
