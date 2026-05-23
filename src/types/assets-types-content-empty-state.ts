export interface AssetTypeContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
  onCreateFirst?: () => void
}
