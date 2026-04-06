import { useState } from "react"
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import type { DeleteFolderDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export function DeleteFolderDialog({
  open,
  onOpenChange,
  folderName,
  onConfirm,
}: DeleteFolderDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { t } = useTranslation('assets')

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
      title={t('deleteFolder.title')}
      description={t('deleteFolder.description', { name: folderName })}
      onConfirm={handleConfirm}
      confirmLabel={t('deleteFolder.confirmLabel')}
      isProcessing={isDeleting}
    />
  )
}
