"use client"

import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useTagMutations } from "@/hooks/useTags"
import type { DeleteTagDialogProps } from '@/types/tags'

export type { DeleteTagDialogProps } from '@/types/tags'

export function TagsDeleteDialog({ open, onOpenChange, tag, canDelete = false }: DeleteTagDialogProps) {
  const { t } = useTranslation(['tags', 'common'])
  const { deleteTag } = useTagMutations()

  if (!canDelete) return null

  const handleDelete = async () => {
    if (!tag || !canDelete) return

    await new Promise<void>((resolve, reject) => {
      deleteTag.mutate(tag.id, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      })
    })
  }

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('deleteDialog.title')}
      description={t('deleteDialog.description', { name: tag?.name })}
      onAction={handleDelete}
      actionLabel={t('common:delete')}
    />
  )
}
