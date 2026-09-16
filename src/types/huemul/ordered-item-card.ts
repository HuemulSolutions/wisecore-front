import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

/**
 * Acción del menú de tres puntos de HuemulOrderedItemCard. Genérico — el
 * dominio de cada consumidor arma su propio array (ver
 * ia context/refactor-file-guide.md §1.2, checklist de promoción a huemul).
 */
export interface HuemulOrderedItemCardMenuAction {
  key: string
  label: string
  icon?: LucideIcon
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

export interface HuemulOrderedItemCardProps {
  /** Ya formateado por el caller ("1", "01", etc). */
  orderLabel: ReactNode
  /** Circulo de orden + borde de la card en azul (tipo IA); default = gris. */
  accent?: boolean
  /** Centro clickeable (título + resumen) — abre la configuración del item. */
  onClick?: () => void
  title: ReactNode
  summary?: ReactNode
  /** Caja "Usa como contexto" u otra nota bajo el resumen. */
  contextBox?: ReactNode
  /** Chips debajo de la caja de contexto (ej. preguntas de un formulario). */
  chips?: ReactNode
  configureLabel?: string
  onConfigure?: () => void
  menuActions?: HuemulOrderedItemCardMenuAction[]
  menuAriaLabel?: string
  /** Slot para el handle de drag&drop del caller (dnd-kit u otro). */
  dragHandle?: ReactNode
  isDragging?: boolean
  className?: string
  /**
   * Controla el menú desde afuera para coordinar "un solo menú abierto a la
   * vez" entre varias cards de una misma lista. Si se omite alguno de los dos,
   * el menú queda no controlado (estado interno).
   */
  menuOpen?: boolean
  onMenuOpenChange?: (open: boolean) => void
}
