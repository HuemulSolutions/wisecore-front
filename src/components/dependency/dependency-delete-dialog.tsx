import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"

interface RemoveDependencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: () => Promise<void>
}

export function RemoveDependencyDialog({
  open,
  onOpenChange,
  onAction,
}: RemoveDependencyDialogProps) {
  const { t } = useTranslation('dependencies')

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      description={t('deleteDialog.description')}
      onAction={onAction}
      actionLabel={t('deleteDialog.removeButton')}
      actionVariant="destructive"
    />
  )
}
