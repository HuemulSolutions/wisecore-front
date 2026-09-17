import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * Estado de la superficie completa (lista + detalle). No incluye "sin
 * selección": eso es un sub-estado de `ready` que el consumidor resuelve con
 * `detail`/`detailPlaceholder` (`detail: null` ⇒ se muestra el placeholder).
 */
export type HuemulMasterDetailState = "loading" | "error" | "empty"

export interface HuemulMasterDetailRow {
  id: string
  icon: LucideIcon
  /** Tono ya resuelto por el consumidor, ej. `"text-[#7c3aed]"`. */
  iconClassName?: string
  title: string
  context?: string | null
  authorName?: string | null
  /** Ya formateado (`formatRelativeTime`); el huemul no formatea fechas. */
  timeLabel?: string
}

export interface HuemulMasterDetailPaneProps {
  /** `undefined`/`"ready"` implícito: hay filas y se listan. */
  state?: HuemulMasterDetailState
  /** Label uppercase del header de la columna, ej. "CAMBIOS" / "EVENTOS". */
  listLabel: string
  /** Filtro del header de la lista. Se mantiene visible en `state="empty"`. */
  listFilter?: ReactNode
  rows: HuemulMasterDetailRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** Pie de la lista: conteo ya formateado por el consumidor. */
  listCountLabel?: string
  loadMore?: {
    label: string
    loading?: boolean
    onClick: () => void
  }
  /** Reemplaza solo la región de filas cuando `state==="empty"` — el header y el filtro siguen visibles. */
  emptyState?: ReactNode
  /** Reemplaza el pane ENTERO cuando `state==="error"`. */
  errorState?: ReactNode
  /** Filas de skeleton cuando `state==="loading"`. Default 6. */
  skeletonRows?: number
  /** Ancho fijo de la columna de lista. Default `"w-[262px]"`. */
  listWidthClassName?: string
  detailHeader?: ReactNode
  /** `null`/`undefined` con `state` en su default ⇒ se muestra `detailPlaceholder`. */
  detail?: ReactNode
  detailPlaceholder?: ReactNode
  className?: string
}
