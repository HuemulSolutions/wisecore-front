"use client"

import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useAuthTypeMutations } from "@/hooks/useAuthTypes"
import type { AuthType } from "@/services/auth-types"

interface DeleteAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
}

export function DeleteAuthTypeDialog({ open, onOpenChange, authType }: DeleteAuthTypeDialogProps) {
  const { t } = useTranslation(['auth-types', 'common'])
  const { deleteAuthType } = useAuthTypeMutations()

  const handleDelete = async () => {
    if (!authType) return

    await new Promise<void>((resolve, reject) => {
      deleteAuthType.mutate(authType.id, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      })
    })
  }

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      description={t('deleteDialog.description', { name: authType?.name })}
      onAction={handleDelete}
      actionLabel={t('common:delete')}
    />
  )
}