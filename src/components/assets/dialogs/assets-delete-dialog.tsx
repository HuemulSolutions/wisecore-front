import { memo } from "react"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { DeleteDocumentDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export const DeleteDocumentDialog = memo(function DeleteDocumentDialog({
  open,
  onOpenChange,
  documentName,
  onConfirm,
}: DeleteDocumentDialogProps) {
  const { t } = useTranslation(["assets", "common"]);
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDocument.title')}
      description={t('deleteDocument.description', { name: documentName })}
      onAction={async () => { onConfirm(); }}
      actionLabel={t('common:delete')}
      actionVariant="destructive"
    />
  )
})
