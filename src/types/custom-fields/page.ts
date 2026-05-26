import type { CustomField } from './core'
import type { useCustomFieldMutations } from '@/hooks/useCustomFields'

export interface CustomFieldPageState {
  searchTerm: string
  editingCustomField: CustomField | null
  showCreateDialog: boolean
  deletingCustomField: CustomField | null
}

export interface CustomFieldPageDialogsProps {
  state: CustomFieldPageState
  onCloseDialog: (dialog: keyof CustomFieldPageState) => void
  customFieldMutations: ReturnType<typeof useCustomFieldMutations>
}
