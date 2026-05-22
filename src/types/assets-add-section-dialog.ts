export interface Section {
  id: string
  name: string
  prompt: string
  dependencies: string[]
  document_id?: string
  template_id?: string
  type?: string
}

export interface AddSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  sectionInsertPosition?: number
  existingSections: Section[]
  onSubmit: (values: any) => void
  isPending: boolean
}
