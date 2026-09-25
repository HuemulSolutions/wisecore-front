export interface RemoveDependencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: () => Promise<void>
}
