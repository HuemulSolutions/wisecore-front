export interface OrganizationContentEmptyStateProps {
  type: "empty" | "no-results" | "error"
  onCreateFirst?: () => void
  onClearFilters?: () => void
  onRetry?: () => void
  message?: string
}

export interface OrganizationPageEmptyStateProps {
  type: "access-denied" | "no-organization"
}

export interface OrganizationPageHeaderProps {
  organizationCount: number
  onCreateOrganization: () => void
  onRefresh: () => void
  isLoading?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  canManage?: boolean
}

export interface OrganizationSelectionDialogProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  preselectedOrganizationId?: string
}
