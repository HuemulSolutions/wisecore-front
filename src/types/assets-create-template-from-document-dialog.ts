export interface CreateTemplateFromDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  organizationId: string | null
  onTemplateCreated: (template: { id: string; name: string }) => void
}
