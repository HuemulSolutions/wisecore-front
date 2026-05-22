export interface AuthTypesSearchProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  authTypesCount: number
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError?: boolean
}
