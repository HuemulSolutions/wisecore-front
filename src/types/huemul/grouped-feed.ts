import type { ReactNode } from "react"

/** Mismos tres estados que `HuemulMasterDetailPane` — ver ese archivo para el criterio. */
export type HuemulGroupedFeedState = "loading" | "empty" | "error" | undefined

export interface HuemulGroupedFeedGroup {
  /** Único en React — el consumidor arma runs (`${value}#${runIndex}`) para grupos repetidos. */
  key: string
  /** Encabezado de grupo, ya traducido/formateado (ej. "SOLICITUD DE INVERSIÓN · 5 EVENTOS"). */
  label: string
  rows: ReactNode[]
}

export interface HuemulGroupedFeedProps {
  state: HuemulGroupedFeedState
  /** Franja fija bajo los tabs, no scrollea (resumen de estado, barra de filtro). */
  contextStrip?: ReactNode
  groups: HuemulGroupedFeedGroup[]
  emptyState: ReactNode
  errorState: ReactNode
  /** Cantidad de filas del skeleton de carga. Default 3. */
  skeletonRows?: number
  footer?: ReactNode
  className?: string
}
