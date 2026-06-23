import { memo } from "react"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { DeleteCustomFieldDialogProps } from "@/types/assets"
export type { DeleteCustomFieldDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export const DeleteCustomFieldDialog = memo(function DeleteCustomFieldDialog({
  open,
  onOpenChange,
  fieldName,
  onAction,
}: DeleteCustomFieldDialogProps) {
  const { t } = useTranslation(["assets", "common"])
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('content.deleteCustomFieldTitle')}
      description={t('content.deleteCustomFieldDescription', { name: fieldName })}
      onAction={onAction}
      actionLabel={t('content.deleteCustomFieldConfirm')}
      actionVariant="destructive"
    />
  )
})
