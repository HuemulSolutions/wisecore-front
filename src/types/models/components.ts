import type { LLM } from './core'

export interface ModelActionsProps {
  model: LLM
  onEdit: (model: LLM) => void
  onDelete: (model: LLM) => void
  onTest: (model: LLM) => void
  onCapabilities: (model: LLM) => void
  isDeleting: boolean
  isTesting: boolean
  dropdownOpen: boolean
  onDropdownChange: (open: boolean) => void
  canUpdate: boolean
  canDelete: boolean
}

export interface ModelsContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
}

export interface ModelsEmptyStateProps {
  title?: string
  description?: string
}

export interface ModelsHeaderProps {
  configuredProviders: number
  totalModels: number
  isLoading: boolean
  onRefresh: () => void
}

export interface ModelsTableProps {
  models: LLM[]
  onEdit: (model: LLM) => void
  onDelete: (model: LLM) => void
  onTest: (model: LLM) => void
  onCapabilities: (model: LLM) => void
  onDefaultChange: (llmId: string, isDefault: boolean) => void
  isDeleting: boolean
  testingModelId: string | null
  openDropdowns: {[key: string]: boolean}
  onDropdownChange: (key: string, open: boolean) => void
  canUpdate: boolean
  canDelete: boolean
}
