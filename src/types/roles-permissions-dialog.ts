import type { DocumentType } from '@/services/document-types'

export interface RolePermissionsDialogProps {
  documentType: DocumentType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}
