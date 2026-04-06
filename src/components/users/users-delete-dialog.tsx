import { useTranslation } from 'react-i18next'
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { type User } from "@/types/users"

interface UserDeleteDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: () => Promise<void>
}

export default function UserDeleteDialog({
  user,
  open,
  onOpenChange,
  onAction
}: UserDeleteDialogProps) {
  const { t } = useTranslation(['users'])

  if (!user) return null

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('users:delete.title')}
      description={t('users:delete.description', { name: `${user.name} ${user.last_name}` })}
      actionLabel={t('common:delete')}
      onAction={onAction}
    />
  )
}