export interface CustomFieldPageEmptyStateProps {
  type: "access-denied" | "error" | "empty"
  message?: string
  onCreateFirst?: () => void
}
