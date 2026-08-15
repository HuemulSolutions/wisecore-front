export interface ModelsContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
}

export interface ModelsHeaderProps {
  configuredProviders: number
  totalModels: number
  isLoading: boolean
  onRefresh: () => void
}
