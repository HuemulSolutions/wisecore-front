import type { CustomField } from './custom-fields'

export interface DeleteCustomFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customField: CustomField | null
  onConfirm: (customField: CustomField) => void
}
