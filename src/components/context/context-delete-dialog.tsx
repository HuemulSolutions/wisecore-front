import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"

interface DeleteContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isProcessing: boolean
}

export function DeleteContextDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing,
}: DeleteContextDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Context"
      description="Are you sure you want to delete this context? This action cannot be undone and may affect document execution."
      onConfirm={onConfirm}
      confirmLabel="Delete"
      isProcessing={isProcessing}
      variant="destructive"
    />
  )
}
