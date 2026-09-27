import { useTranslation } from 'react-i18next'
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import type { UserDeleteDialogProps } from '@/types/users'
export type { UserDeleteDialogProps } from '@/types/users'

export default function UserDeleteDialog({
  user,
  open,
  onOpenChange,
  onAction,
  canDelete
}: UserDeleteDialogProps) {
  const { t } = useTranslation(['users'])

  if (!user || !canDelete) return null

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('users:delete.title')}
      description={t('users:delete.description', { name: `${user.name} ${user.last_name}` })}
      actionLabel={t('common:delete')}
      onAction={async () => {
        if (!canDelete) return
        await onAction()
      }}
    />
  )
}