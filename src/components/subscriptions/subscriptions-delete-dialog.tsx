"use client"

import { useTranslation } from "react-i18next"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useSubscriptionMutations } from "@/hooks/useSubscriptions"
import type { Subscription } from "@/types/subscriptions"

interface SubscriptionDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  item: Subscription | null
}

export function SubscriptionDeleteDialog({
  open,
  onOpenChange,
  organizationId,
  item,
}: SubscriptionDeleteDialogProps) {
  const { t } = useTranslation("subscriptions")
  const { deleteSubscription } = useSubscriptionMutations(organizationId)

  const handleDelete = async () => {
    if (!item) return
    await new Promise<void>((resolve, reject) => {
      deleteSubscription.mutate(item.id, {
        onSuccess: () => resolve(),
        onError: (err) => reject(err),
      })
    })
  }

  return (
    <HuemulAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("delete.title")}
      description={t("delete.description", {
        name: item?.document_name ?? item?.document_id ?? "",
      })}
      actionLabel={t("delete.confirmLabel")}
      onAction={handleDelete}
    />
  )
}
