export interface AddCustomFieldDocumentDialogProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  onAdd: (data: any) => Promise<any>
  onImageUploadStart?: (fieldId: string) => void
  onImageUploadComplete?: () => void
}
