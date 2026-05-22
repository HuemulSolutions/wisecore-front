export interface DeleteSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: () => Promise<void>
}
