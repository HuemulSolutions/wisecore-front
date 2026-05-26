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
}
