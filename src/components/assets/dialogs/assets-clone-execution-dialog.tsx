import { memo } from "react"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { CloneExecutionDialogProps } from "@/types/assets"
export type { CloneExecutionDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export const CloneExecutionDialog = memo(function CloneExecutionDialog({
  open,
  onOpenChange,
  executionName,
  onAction,
}: CloneExecutionDialogProps) {
  const { t } = useTranslation(["assets", "common"])
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('content.cloneExecutionTitle')}
      description={
        executionName
          ? t('content.cloneExecutionDescription', { name: executionName })
          : t('content.cloneExecutionFallback')
      }
      onAction={onAction}
      actionLabel={t('content.cloneConfirm')}
      actionVariant="default"
    />
  )
})
