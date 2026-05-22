import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { DeleteRoleDialogProps } from '@/types/roles-delete-dialog'
export type { DeleteRoleDialogProps } from '@/types/roles-delete-dialog'

export function DeleteRoleDialog({ open, onOpenChange, role, onConfirm }: DeleteRoleDialogProps) {
  const { t } = useTranslation('roles')
  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('delete.title')}
      description={t('delete.description', { name: role?.name })}
      onAction={onConfirm}
      actionLabel={t('delete.title')}
    />
  )
}
