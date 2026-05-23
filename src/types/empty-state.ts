export interface EmptyStateProps {
  type: 'no-organization' | 'permission-error'
  onChangeOrganization?: () => void
}
