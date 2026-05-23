import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { DeleteContextDialogProps } from "@/types/context-delete-dialog"

export type { DeleteContextDialogProps } from "@/types/context-delete-dialog"

export function DeleteContextDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteContextDialogProps) {
  const { t } = useTranslation(['context', 'common'])

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      description={t('deleteDialog.description')}
      actionLabel={t('common:delete')}
      onAction={onConfirm}
      actionVariant="destructive"
      actionIcon={Trash2}
    />
  )
}
