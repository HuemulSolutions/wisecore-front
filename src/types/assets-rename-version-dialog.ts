export interface RenameVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (name: string) => void
  currentName: string
  isProcessing?: boolean
}
