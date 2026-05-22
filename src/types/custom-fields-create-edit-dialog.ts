import type { CustomField } from './custom-fields'
import type { useCustomFieldMutations } from '@/hooks/useCustomFields'

export interface CreateEditCustomFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customField: CustomField | null
  onSuccess: () => void
  customFieldMutations: ReturnType<typeof useCustomFieldMutations>
}
