export interface AiEditSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (prompt: string) => void
  isProcessing?: boolean
}
