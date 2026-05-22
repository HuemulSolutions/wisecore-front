import type { CustomFieldPageState } from './custom-fields-page-state'
import type { useCustomFieldMutations } from '@/hooks/useCustomFields'

export interface CustomFieldPageDialogsProps {
  state: CustomFieldPageState
  onCloseDialog: (dialog: keyof CustomFieldPageState) => void
  customFieldMutations: ReturnType<typeof useCustomFieldMutations>
}
