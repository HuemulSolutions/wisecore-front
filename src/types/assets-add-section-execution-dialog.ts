import type { AddSectionExecutionRequest } from '@/services/section_execution'

export interface SectionOption {
  id: string
  name: string
}

export interface AddSectionExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  afterFromSectionId: string | null
  existingSections: SectionOption[]
  onSubmit: (values: AddSectionExecutionRequest) => void
  isPending: boolean
  onClose: () => void
  defaultType?: 'ai' | 'manual' | 'reference'
  defaultManualInput?: string
}
