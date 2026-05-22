import type { LLM } from '@/types/llm'

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
