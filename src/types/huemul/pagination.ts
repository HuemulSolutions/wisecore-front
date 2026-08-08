export interface HuemulPaginationProps {
  page: number
  pageSize: number
  totalItems?: number
  hasNext?: boolean
  hasPrevious?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  className?: string
  /** `card` (default) mantiene fondo/borde/sombra propios; `bare` los quita para embeberla en un footer propio. */
  variant?: "card" | "bare"
  /** Posición del label de rango ("1–8 de 13"). Default `end`. */
  labelPosition?: "start" | "end"
  /** Muestra los botones de primera/última página. Default `true`. */
  showFirstLast?: boolean
}
