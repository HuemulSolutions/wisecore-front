"use client"

import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useExternalFunctionalityMutations } from "@/hooks/useExternalFunctionalities"
import type { ExternalFunctionalityDeleteDialogProps } from "@/types/external-functionalities"

export type { ExternalFunctionalityDeleteDialogProps } from "@/types/external-functionalities"

export function ExternalFunctionalityDeleteDialog({
  open,
  onOpenChange,
  organizationId,
  systemId,
  functionality,
  canDelete,
  onDeleted,
}: ExternalFunctionalityDeleteDialogProps) {
  const { t } = useTranslation(["external-functionalities", "common"])
  const { deleteExternalFunctionality } = useExternalFunctionalityMutations(organizationId, systemId)

  const handleDelete = async () => {
    if (!canDelete || !functionality) return
    await new Promise<void>((resolve, reject) => {
      deleteExternalFunctionality.mutate(functionality.id, {
        onSuccess: () => {
          onDeleted?.()
          resolve()
        },
        onError: (err) => reject(err),
      })
    })
  }

  if (!canDelete) return null

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("delete.title")}
      description={t("delete.description", { name: functionality?.name })}
      actionLabel={t("common:delete")}
      onAction={handleDelete}
    />
  )
}
