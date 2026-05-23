import type { CustomField } from './custom-fields'

export interface CustomFieldPageState {
  searchTerm: string
  editingCustomField: CustomField | null
  showCreateDialog: boolean
  deletingCustomField: CustomField | null
}
