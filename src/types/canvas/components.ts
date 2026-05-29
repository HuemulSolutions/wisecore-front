import type { Canvas } from './core'
import type { HuemulTablePagination } from '@/types/huemul'

export interface CanvasContentEmptyStateProps {
  type: "error" | "empty" | "no-results"
  message?: string
  onRetry?: () => void
  onCreateFirst?: () => void
  onClearFilters?: () => void
}

export interface CanvasPageEmptyStateProps {
  type: "access-denied" | "no-organization" | "error"
  message?: string
}

export interface CanvasPageHeaderProps {
  canvasCount: number
  onCreateCanvas: () => void
  onRefresh: () => void
  isLoading?: boolean
  searchTerm?: string
  onSearchChange: (value: string) => void
  canManage?: boolean
}

export interface CanvasTableProps {
  items: Canvas[]
  onEdit: (canvas: Canvas) => void
  onDelete: (canvas: Canvas) => void
  pagination?: HuemulTablePagination
  canManage?: boolean
  isLoading?: boolean
  isFetching?: boolean
}
