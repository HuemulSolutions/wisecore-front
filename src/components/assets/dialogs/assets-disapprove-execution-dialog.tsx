import { memo } from "react"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { DisapproveExecutionDialogProps } from "@/types/assets"
export type { DisapproveExecutionDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export const DisapproveExecutionDialog = memo(function DisapproveExecutionDialog({
  open,
  onOpenChange,
  executionName,
  onAction,
}: DisapproveExecutionDialogProps) {
  const { t } = useTranslation(["assets", "common"])
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('content.disapproveTitle')}
      description={
        executionName
          ? t('content.disapproveDescription', { name: executionName })
          : t('content.disapproveFallback')
      }
      onAction={onAction}
      actionLabel={t('content.convertToDraft')}
      actionVariant="destructive"
    />
  )
})
