export interface OrganizationContentEmptyStateProps {
  type: "empty" | "no-results" | "error"
  onCreateFirst?: () => void
  onClearFilters?: () => void
  onRetry?: () => void
  message?: string
}
