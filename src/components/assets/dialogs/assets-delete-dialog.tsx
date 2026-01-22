import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import type { DeleteDocumentDialogProps } from "@/types/assets"

export function DeleteDocumentDialog({
  open,
  onOpenChange,
  documentName,
  onConfirm,
  isDeleting = false,
}: DeleteDocumentDialogProps) {
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Document"
      description={`Are you sure you want to delete "${documentName}"? This action cannot be undone and all associated data will be permanently deleted.`}
      onConfirm={onConfirm}
      confirmLabel="Delete"
      isProcessing={isDeleting}
      variant="destructive"
    />
  )
}
