import type { CustomFieldDocument } from '@/types/custom-fields-documents'

export interface CustomFieldsListProps {
  customFields: CustomFieldDocument[]
  isLoading: boolean
  onAdd: () => void
  onEdit: (field: CustomFieldDocument) => void
  onEditContent: (field: CustomFieldDocument) => void
  onDelete: (field: CustomFieldDocument) => void
  onRefresh: () => void
  uploadingImageFieldId?: string | null
  isRefreshing?: boolean
  canEdit?: boolean
}
