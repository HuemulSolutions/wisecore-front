import { memo } from "react"
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import type { DeleteDocumentDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export const DeleteDocumentDialog = memo(function DeleteDocumentDialog({
  open,
  onOpenChange,
  documentName,
  onConfirm,
  isDeleting = false,
}: DeleteDocumentDialogProps) {
  const { t } = useTranslation('assets');
  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDocument.title')}
      description={t('deleteDocument.description', { name: documentName })}
      onConfirm={onConfirm}
      confirmLabel={t('deleteDocument.confirmLabel')}
      isProcessing={isDeleting}
      variant="destructive"
    />
  )
})
