import { useState } from "react"
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import type { DeleteFolderDialogProps } from "@/types/assets"

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderName,
  onConfirm,
}: DeleteFolderDialogProps) {
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
      title="Delete Folder"
      description={`Are you sure you want to delete "${folderName}"? All files and subfolders will be permanently deleted and this action cannot be undone.`}
      onConfirm={handleConfirm}
      confirmLabel="Deleting"
      isProcessing={isDeleting}
    />
  )
}
