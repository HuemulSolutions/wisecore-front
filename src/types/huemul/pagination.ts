export interface HuemulPaginationProps {
  page: number
  pageSize: number
  totalItems?: number | null
  hasNext?: boolean
  hasPrevious?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
  /** `card` (default) mantiene fondo/borde/sombra propios; `bare` los quita para embeberla en un footer propio; `detailed` usa el estilo cerrado (ver `ia context`). */
  variant?: "card" | "bare" | "detailed"
  /** Posición del label de rango ("1–8 de 13"). Default `end`. */
  labelPosition?: "start" | "end"
  /** Muestra los botones de primera/última página. Default `true`. */
  showFirstLast?: boolean
  /** Solo aplica a `variant="detailed"`. Oculta los botones numerados, dejando solo Prev/Next. Default `true`. */
  showPageNumbers?: boolean
  /** Solo aplica a `variant="detailed"`. Oculta el label "Mostrando X–Y de Z". Default `true`. */
  showSummary?: boolean
}
