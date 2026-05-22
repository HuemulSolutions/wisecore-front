export interface CustomWordExportSheetProps {
  selectedFile: {
    id: string
    name: string
    type: 'folder' | 'document'
  } | null
  selectedExecutionId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}
