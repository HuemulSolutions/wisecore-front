"use client"

import { ChevronDown } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import type { HuemulSectionCardProps } from "@/types/huemul"

export type { HuemulSectionCardProps } from "@/types/huemul"

/**
 * Tarjeta de sección: shell blanco + header opcional (título, subtítulo, bloque
 * a la derecha) + body + pie opcional, y colapsable si se le pasa `open`.
 *
 * Unifica tres cosas que vivían separadas en `src/components/assets-types/`:
 * `PanelCard` (el shell suelto), el header de sección que
 * `AssetTypeGeneralFormFields` dibujaba a mano y duplicado en sus dos cards, y
 * `PanelCollapsibleCard` (que ya tenía el header extraído pero obligaba a ser
 * colapsable). Aquellos dos siguen existiendo como alias/wrapper para no tocar
 * a sus consumidores.
 *
 * Las clases son las de esas piezas, literales, para que ninguna superficie
 * existente cambie de aspecto — incluidos los hex en vez de tokens del tema.
 */
export function HuemulSectionCard({
  title,
  subtitle,
  headerRight,
  footer,
  open,
  onOpenChange,
  bodyClassName,
  className,
  children,
}: HuemulSectionCardProps) {
  const hasHeader = !!title
  const isCollapsible = hasHeader && open !== undefined
  const shell = cn(
    "rounded-[10px] border border-[#e3e9f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
    // Solo hace falta recortar cuando hay bordes internos que tocan la esquina.
    (hasHeader || footer) && "overflow-hidden",
    className,
  )

  const headerInner = (
    <>
      <span className="shrink-0 text-[13px] font-semibold text-[#0f172a]">{title}</span>
      {subtitle && <span className="truncate text-[11.5px] text-[#94a3b8]">{subtitle}</span>}
    </>
  )

  const body = <div className={cn("border-t border-[#eef1f5] px-4 py-4", bodyClassName)}>{children}</div>

  const footerBlock = footer && (
    <div className="flex items-start gap-2 border-t border-[#eef1f5] bg-[#f8fafc] px-4 py-3 text-[12px] leading-snug text-[#475569]">
      {footer}
    </div>
  )

  // Sin título: shell puro. El contenido va directo adentro, sin div de body ni
  // padding — es el contrato de `PanelCard`, cuyos consumidores pasan su propio
  // padding por `className`. No envolver acá.
  if (!hasHeader) {
    return (
      <div className={shell}>
        {children}
        {footerBlock}
      </div>
    )
  }

  if (isCollapsible) {
    return (
      <div className={shell}>
        <Collapsible open={open} onOpenChange={onOpenChange}>
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-3 text-left hover:cursor-pointer">
            <ChevronDown
              className={cn("size-3.5 shrink-0 text-[#94a3b8] transition-transform", !open && "-rotate-90")}
            />
            <div className="flex min-w-0 flex-1 items-baseline gap-2">{headerInner}</div>
            {headerRight && (
              // El header es el trigger: sin esto, un click en un botón del
              // bloque derecho también colapsaría la card.
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {headerRight}
              </div>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className={cn("border-t border-[#eef1f5] px-4 py-4", bodyClassName)}>
            {children}
          </CollapsibleContent>
        </Collapsible>
        {footerBlock}
      </div>
    )
  }

  return (
    <div className={shell}>
      <div className="flex items-baseline gap-2 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-baseline gap-2">{headerInner}</div>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
      {body}
      {footerBlock}
    </div>
  )
}
