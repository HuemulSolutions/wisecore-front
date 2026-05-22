export interface AssignVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (version: { major: number; minor: number; patch: number }) => void
  isProcessing?: boolean
}
