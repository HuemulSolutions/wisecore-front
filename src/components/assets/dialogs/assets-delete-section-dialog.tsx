import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"

interface DeleteSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isDeleting: boolean
}

export function DeleteSectionDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteSectionDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Section"
      description="Are you sure you want to delete this section? This action cannot be undone."
      onConfirm={onConfirm}
      confirmLabel="Delete"
      cancelLabel="Cancel"
      isProcessing={isDeleting}
      variant="destructive"
    />
  )
}
