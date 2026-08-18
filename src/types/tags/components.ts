import type { Tag } from './core'
import type { HuemulTablePagination } from '@/huemul/components/huemul-table'

export interface TagsPageHeaderProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  tagsCount: number
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError?: boolean
  canCreate?: boolean
}

export interface TagsTableProps {
  tags: Tag[]
  onEdit: (tag: Tag) => void
  onDelete: (tag: Tag) => void
  isLoading?: boolean
  isFetching?: boolean
  pagination?: HuemulTablePagination
  searchTerm?: string
  canUpdate?: boolean
  canDelete?: boolean
}

export interface TagsErrorStateProps {
  error?: unknown
  onRetry?: () => void
}
