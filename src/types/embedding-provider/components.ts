export type EmbeddingProviderCardData = {
  id: string
  name: string
  display_name?: string
  isConfigured: boolean
}

export interface EmbeddingProviderCardProps {
  provider: EmbeddingProviderCardData
  isOpen: boolean
  onToggle: (open: boolean) => void
  onEditProvider: (provider: EmbeddingProviderCardData) => void
  onDeleteProvider: (provider: EmbeddingProviderCardData) => void
  onConfigureProvider: (provider: EmbeddingProviderCardData) => void
  onTestProvider?: () => void
  isTestingProvider?: boolean
  isDeleting: boolean
  openDropdowns: { [key: string]: boolean }
  onDropdownChange: (key: string, open: boolean) => void
  canCreateProvider: boolean
  canUpdateProvider: boolean
  canDeleteProvider: boolean
}
