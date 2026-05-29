import type { LLM } from '@/types/models'

export interface ProviderCardProps {
  provider: any
  models: LLM[]
  isOpen: boolean
  onToggle: (open: boolean) => void
  onEditProvider: (provider: any) => void | Promise<void>
  onDeleteProvider: (provider: any) => void
  onConfigureProvider: (provider: any) => void
  onCreateModel: (providerId: string) => void
  onEditModel: (model: LLM) => void
  onDeleteModel: (model: LLM) => void
  onTestModel: (model: LLM) => void
  onCapabilitiesModel: (model: LLM) => void
  onDefaultChange: (llmId: string, isDefault: boolean) => void
  isDeleting: boolean
  isDeletingModel: boolean
  testingModelId: string | null
  isLoadingModels?: boolean
  modelsError?: any
  openDropdowns: {[key: string]: boolean}
  onDropdownChange: (key: string, open: boolean) => void
  canCreateProvider: boolean
  canUpdateProvider: boolean
  canDeleteProvider: boolean
  canCreateModel: boolean
  canUpdateModel: boolean
  canDeleteModel: boolean
}

export interface ProviderActionsProps {
  provider: any
  onEdit: (provider: any) => void | Promise<void>
  onDelete: (provider: any) => void
  isDeleting: boolean
  dropdownOpen: boolean
  onDropdownChange: (open: boolean) => void
  canUpdate: boolean
  canDelete: boolean
}
