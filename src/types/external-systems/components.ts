import type { ExternalSystem } from './core'
import type { HuemulTablePagination } from '@/types/huemul'

export interface ExternalSystemsErrorStateProps {
  error: Error | unknown
  onRetry?: () => void
}

export interface ExternalSystemsPageHeaderProps {
  systemsCount: number
  searchValue: string
  onSearchChange: (value: string) => void
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError: boolean
}

export interface ExternalSystemsTableProps {
  systems: ExternalSystem[]
  onEdit: (system: ExternalSystem) => void
  onDelete: (system: ExternalSystem) => void
  isLoading?: boolean
  isFetching?: boolean
  pagination?: HuemulTablePagination
  searchTerm?: string
}
