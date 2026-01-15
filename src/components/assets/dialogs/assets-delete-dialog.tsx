import { useState } from "react"
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import type { DeleteDocumentDialogProps } from "@/types/assets"

export function DeleteDocumentDialog({
  open,
  onOpenChange,
  documentName,
  onConfirm,
}: DeleteDocumentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Document"
      description={`Are you sure you want to delete "${documentName}"? This action cannot be undone and all associated data will be permanently deleted.`}
      onConfirm={handleConfirm}
      confirmLabel="Deleting"
      isProcessing={isDeleting}
    />
  )
}
