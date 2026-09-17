import { cn } from "@/lib/utils"
import type { HuemulContextStripProps } from "@/types/huemul"
export type { HuemulContextStripProps, HuemulContextStripBlock } from "@/types/huemul"

/**
 * Franja de bloques label+valor bajo una barra de tabs, separados por
 * divisores verticales — el resumen de estado del sheet de historial
 * angosto (`ia context/detail-surface-guide.md`) y cualquier otra barra
 * "métrica + filtro" que viva bajo tabs. Sin dominio: recibe cada bloque
 * ya resuelto por props.
 */
export function HuemulContextStrip({ blocks, className }: HuemulContextStripProps) {
  return (
    <div className={cn("flex shrink-0 items-center gap-4 bg-[#fcfdfe] px-[22px] py-2.5", className)}>
      {blocks.map((block, index) => (
        <div key={block.key} className={cn("flex items-center gap-4", block.grow && "flex-1 justify-end")}>
          {index > 0 && <span className="h-[34px] w-px shrink-0 bg-[#e8ecf2]" aria-hidden="true" />}
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">{block.label}</p>
            <div className="mt-1">{block.content}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
