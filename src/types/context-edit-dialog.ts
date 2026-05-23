export interface ContextItem {
  id: string
  name: string
  content: string
  context_type?: string
}

export interface EditContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: ContextItem | null
  onConfirm: (id: string, name: string, content: string) => void
  isProcessing: boolean
}
