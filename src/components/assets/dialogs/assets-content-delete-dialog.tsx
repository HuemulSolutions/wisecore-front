import { memo } from "react"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { ContentDeleteDialogProps } from "@/types/assets"
export type { ContentDeleteDialogProps } from "@/types/assets"
import { useTranslation } from "react-i18next"

export const ContentDeleteDialog = memo(function ContentDeleteDialog({
  open,
  onOpenChange,
  deleteType,
  documentName,
  executionFormattedDate,
  onAction,
}: ContentDeleteDialogProps) {
  const { t } = useTranslation(["assets", "common"])
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={deleteType === 'execution' ? t('content.deleteVersionTitle') : t('content.deleteDocumentTitle')}
      description={
        deleteType === 'execution'
          ? (executionFormattedDate
              ? t('content.deleteExecutionDescription', { date: executionFormattedDate })
              : t('content.deleteExecutionFallback'))
          : t('content.deleteDocumentDescription', { name: documentName })
      }
      onAction={onAction}
      actionLabel={t('content.deleteConfirm')}
      actionVariant="destructive"
    />
  )
})
