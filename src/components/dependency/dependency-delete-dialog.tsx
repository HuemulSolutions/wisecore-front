import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"

interface RemoveDependencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isProcessing: boolean
}

export function RemoveDependencyDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing,
}: RemoveDependencyDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove Dependency"
      description="Are you sure you want to remove this dependency? This action cannot be undone and may affect document relationships."
      onConfirm={onConfirm}
      confirmLabel="Remove"
      isProcessing={isProcessing}
      variant="destructive"
    />
  )
}
