"use client"

import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useExternalSystemMutations } from "@/hooks/useExternalSystems"
import type { ExternalSystem } from "@/types/external-systems"

interface ExternalSystemDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  system: ExternalSystem | null
  onDeleted?: () => void
}

export function ExternalSystemDeleteDialog({
  open,
  onOpenChange,
  organizationId,
  system,
  onDeleted,
}: ExternalSystemDeleteDialogProps) {
  const { t } = useTranslation(["external-systems", "common"])
  const { deleteExternalSystem } = useExternalSystemMutations(organizationId)

  const handleDelete = async () => {
    if (!system) return
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
