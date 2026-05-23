import type { ExternalSystem } from '@/types/external-systems'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

export interface ExternalSystemsTableProps {
  systems: ExternalSystem[]
  onEdit: (system: ExternalSystem) => void
  onDelete: (system: ExternalSystem) => void
  isLoading?: boolean
  isFetching?: boolean
  pagination?: HuemulTablePagination
  searchTerm?: string
}
