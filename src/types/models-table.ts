import type { LLM } from '@/types/llm'

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
