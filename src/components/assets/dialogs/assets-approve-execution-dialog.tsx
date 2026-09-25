import { memo } from "react"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { ApproveExecutionDialogProps } from "@/types/assets"
export type { ApproveExecutionDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export const ApproveExecutionDialog = memo(function ApproveExecutionDialog({
  open,
  onOpenChange,
  executionName,
  onAction,
}: ApproveExecutionDialogProps) {
  const { t } = useTranslation(["assets", "common"])
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('content.approveExecutionTitle')}
      description={
        executionName
          ? t('content.approveExecutionDescription', { name: executionName })
          : t('content.approveExecutionFallback')
      }
      onAction={onAction}
      actionLabel={t('content.approveConfirm')}
      actionVariant="default"
    />
  )
})
