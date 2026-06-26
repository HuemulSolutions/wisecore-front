import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type HuemulTableActionsMode = "dropdown" | "inline"

export interface HuemulTableColumn<T> {
  key: string
  label: string
  width?: string
  /** Ancho inicial en px cuando la tabla es redimensionable (`resizable`). */
  defaultWidth?: number
  /** Ancho mínimo en px al arrastrar. Default interno: 80. */
  minWidth?: number
  /** Permite excluir una columna del redimensionado (default: true cuando la tabla es `resizable`). */
  resizable?: boolean
  hideOnMobile?: boolean
  align?: "left" | "right" | "center"
  render: (item: T) => ReactNode
  sortKey?: string
}

export interface HuemulTableAction<T> {
  key: string
  label: string
  icon: LucideIcon
  onClick: (item: T) => void
  separator?: boolean
  destructive?: boolean
  className?: string
  show?: (item: T) => boolean
  isLoading?: (item: T) => boolean
  disabled?: (item: T) => boolean
}

export interface HuemulTableEmptyState {
  icon?: LucideIcon
  title: string
  description?: string
}

export interface HuemulTablePagination {
  page: number
  pageSize: number
  totalItems?: number
  hasNext?: boolean
  hasPrevious?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
}

export interface HuemulTableProps<T> {
  data: T[]
  columns: HuemulTableColumn<T>[]
  actions?: HuemulTableAction<T>[]
  actionsMode?: HuemulTableActionsMode
  getRowKey: (item: T) => string
  getRowClassName?: (item: T) => string
  emptyState?: HuemulTableEmptyState
  pagination?: HuemulTablePagination
  isLoading?: boolean
  isFetching?: boolean
  error?: Error | null
  onRetry?: () => void
  sort?: string | null
  onSortChange?: (sort: string | null) => void
  maxHeight?: string
  className?: string
  /** Habilita el redimensionado de columnas arrastrando el borde de la cabecera. */
  resizable?: boolean
  /** Clave de localStorage para persistir los anchos. Si se omite con `resizable`, los anchos viven solo en memoria. */
  columnsStorageKey?: string
}
