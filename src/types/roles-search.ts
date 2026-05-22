export interface RolesSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  rolesCount: number
  isRefreshing: boolean
  onRefresh: () => void
  onCreateRole: () => void
  hasError?: boolean
  canManage?: boolean
}
