export interface OrganizationPageHeaderProps {
  organizationCount: number
  onCreateOrganization: () => void
  onRefresh: () => void
  isLoading?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  canManage?: boolean
}
