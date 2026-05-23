import type { CustomFieldDocument } from './custom-fields-documents'

export interface EditCustomFieldAssetDialogProps {
  isOpen: boolean
  onClose: () => void
  customFieldDocument: CustomFieldDocument | null
  onUpdate: (id: string, data: any) => void
  mode?: 'content' | 'configuration'
}
