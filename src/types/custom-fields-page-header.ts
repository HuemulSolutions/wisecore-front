export interface CustomFieldPageHeaderProps {
  customFieldCount: number
  onCreateCustomField: () => void
  onRefresh: () => void
  isLoading?: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  canManage?: boolean
}
