import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export interface TableColumn<T> {
  /** Unique key for the column */
  key: string
  /** Header label to display */
  label: string
  /** Optional custom width class (e.g., "w-[20%]") */
  width?: string
  /** Whether to hide on mobile (sm:table-cell) */
  hideOnMobile?: boolean
  /** Text alignment */
  align?: "left" | "right" | "center"
  /** Custom render function for cell content */
  render: (item: T) => ReactNode
}

export interface TableAction<T> {
  /** Unique key for the action */
  key: string
  /** Label to display in dropdown */
  label: string
  /** Icon component */
  icon: LucideIcon
  /** Click handler */
  onClick: (item: T) => void
  /** Whether to show separator after this action */
  separator?: boolean
  /** Whether action is destructive (shows red) */
  destructive?: boolean
  /** Custom className for the menu item */
  className?: string
  /** Whether to show this action (conditional) */
  show?: (item: T) => boolean
}

export interface EmptyState {
  /** Icon to display */
  icon: LucideIcon
  /** Title text */
  title: string
  /** Description text */
  description: string
}

export interface FooterStat {
  /** Label for the stat */
  label: string
  /** Value to display */
  value: string | number
}

export interface PaginationConfig {
  /** Current page number (1-indexed) */
  page: number
  /** Number of items per page */
  pageSize: number
  /** Total number of items across all pages (optional, for full pagination) */
  totalItems?: number
  /** Whether there is a next page (for cursor-based pagination) */
  hasNext?: boolean
  /** Whether there is a previous page (for cursor-based pagination) */
  hasPrevious?: boolean
  /** Handler for page change */
  onPageChange: (page: number) => void
  /** Handler for page size change */
  onPageSizeChange?: (pageSize: number) => void
  /** Available page size options */
  pageSizeOptions?: number[]
}

export interface DataTableProps<T> {
  /** Array of data items to display */
  data: T[]
  /** Column definitions */
  columns: TableColumn<T>[]
  /** Actions for each row */
  actions?: TableAction<T>[]
  /** Function to get unique key for each row */
  getRowKey: (item: T) => string
  /** Empty state configuration */
  emptyState?: EmptyState
  /** Footer statistics */
  footerStats?: FooterStat[]
  /** Optional checkbox column */
  showCheckbox?: boolean
  /** Selected items (if checkboxes enabled) */
  selectedItems?: Set<string>
  /** Handler for item selection */
  onItemSelection?: (itemKey: string) => void
  /** Handler for select all */
  onSelectAll?: () => void
  /** Custom row className */
  rowClassName?: string
  /** Max height for table container */
  maxHeight?: string
  /** Pagination configuration (optional) */
  pagination?: PaginationConfig
  /** Show footer stats (default: true) */
  showFooterStats?: boolean
}
