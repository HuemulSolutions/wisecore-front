import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { type Role } from "@/services/rbac"

interface DeleteRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  onConfirm: () => Promise<void>
}

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
