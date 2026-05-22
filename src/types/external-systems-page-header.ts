export interface ExternalSystemsPageHeaderProps {
  systemsCount: number
  searchValue: string
  onSearchChange: (value: string) => void
  isLoading: boolean
  onRefresh: () => void
  onCreateClick: () => void
  hasError?: boolean
}
