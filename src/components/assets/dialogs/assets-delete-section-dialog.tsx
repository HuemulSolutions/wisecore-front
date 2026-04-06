import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"

interface DeleteSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: () => Promise<void>
}

export function DeleteSectionDialog({
  open,
  onOpenChange,
  onAction,
}: DeleteSectionDialogProps) {
  const { t } = useTranslation('sections')
  const { t: tCommon } = useTranslation('common')

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      description={t('deleteDialog.description')}
      onAction={onAction}
      actionLabel={tCommon('delete')}
      cancelLabel={tCommon('cancel')}
      actionVariant="destructive"
    />
  )
}
