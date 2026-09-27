"use client"

import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useDocumentTypeRelationshipMutations } from "@/hooks/useDocumentTypeRelationships"
import type { RelationshipDeleteDialogProps } from "@/types/document-type-relationships"

export function RelationshipDeleteDialog({
  open,
  onOpenChange,
  organizationId,
  relationship,
  onDeleted,
}: RelationshipDeleteDialogProps) {
  const { t } = useTranslation(["document-type-relationships", "common"])
  const { deleteDocumentTypeRelationship } = useDocumentTypeRelationshipMutations(organizationId)

  const configId: string = relationship?.id ?? ""
  const configName: string = relationship?.name ?? ""

  const handleDelete = async () => {
    if (!configId) return
    await new Promise<void>((resolve, reject) => {
      deleteDocumentTypeRelationship.mutate(configId, {
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
      description={t("delete.description", { name: configName })}
      actionLabel={t("delete.confirmLabel")}
      onAction={handleDelete}
    />
  )
}
