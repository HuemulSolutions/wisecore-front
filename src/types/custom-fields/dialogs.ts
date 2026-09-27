import type { CustomField } from './core'
import type { useCustomFieldMutations } from '@/hooks/useCustomFields'

export interface CreateEditCustomFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customField: CustomField | null
  onSuccess: (created?: CustomField) => void
  customFieldMutations: ReturnType<typeof useCustomFieldMutations>
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}
