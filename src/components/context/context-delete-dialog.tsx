import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"

interface DeleteContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function DeleteContextDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteContextDialogProps) {
  const { t } = useTranslation('context')

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      description={t('deleteDialog.description')}
      actionLabel={t('deleteDialog.deleteButton')}
      onAction={onConfirm}
      actionVariant="destructive"
      actionIcon={Trash2}
    />
  )
}
