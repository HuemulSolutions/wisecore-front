"use client"

import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useExternalFunctionalityMutations } from "@/hooks/useExternalFunctionalities"
import type { ExternalFunctionality } from "@/types/external-functionalities"

interface ExternalFunctionalityDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  functionality: ExternalFunctionality | null
  onDeleted?: () => void
}

export function ExternalFunctionalityDeleteDialog({
  open,
  onOpenChange,
  organizationId,
  systemId,
  functionality,
  onDeleted,
}: ExternalFunctionalityDeleteDialogProps) {
  const { t } = useTranslation(["external-functionalities", "common"])
  const { deleteExternalFunctionality } = useExternalFunctionalityMutations(organizationId, systemId)

  const handleDelete = async () => {
    if (!functionality) return
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
