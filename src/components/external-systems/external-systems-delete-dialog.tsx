"use client"

import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useExternalSystemMutations } from "@/hooks/useExternalSystems"
import type { ExternalSystemDeleteDialogProps } from "@/types/external-systems"

export type { ExternalSystemDeleteDialogProps } from "@/types/external-systems"

export function ExternalSystemDeleteDialog({
  open,
  onOpenChange,
  organizationId,
  system,
  canDelete,
  onDeleted,
}: ExternalSystemDeleteDialogProps) {
  const { t } = useTranslation(["external-systems", "common"])
  const { deleteExternalSystem } = useExternalSystemMutations(organizationId)

  const handleDelete = async () => {
    if (!canDelete || !system) return
    await new Promise<void>((resolve, reject) => {
      deleteExternalSystem.mutate(system.id, {
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
      description={t("delete.description", { name: system?.name })}
      actionLabel={t("common:delete")}
      onAction={handleDelete}
    />
  )
}

