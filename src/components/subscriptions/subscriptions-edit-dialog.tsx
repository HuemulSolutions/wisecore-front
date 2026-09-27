"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Edit } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useSubscriptionMutations } from "@/hooks/useSubscriptions"
import type { Subscription, UpdateSubscriptionRequest } from "@/types/subscriptions"

interface SubscriptionEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  item: Subscription | null
}

export function SubscriptionEditDialog({
  open,
  onOpenChange,
  organizationId,
  item,
}: SubscriptionEditDialogProps) {
  const { t } = useTranslation(["subscriptions", "common"])
  const [formData, setFormData] = useState<UpdateSubscriptionRequest>({
    notify_email: false,
    notify_in_app: true,
    days_before: undefined,
    require_read_ack: false,
    comment: undefined,
  })
  const { updateSubscription } = useSubscriptionMutations(organizationId)

  useEffect(() => {
    if (item && open) {
      setFormData({
        notify_email: item.notify_email,
        notify_in_app: item.notify_in_app,
        days_before: item.days_before ?? undefined,
        require_read_ack: item.require_read_ack,
        comment: item.comment ?? undefined,
      })
    }
  }, [item, open])

  const handleChange = <K extends keyof UpdateSubscriptionRequest>(
    field: K,
    value: UpdateSubscriptionRequest[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!item) return
    await new Promise<void>((resolve, reject) => {
      updateSubscription.mutate(
        { subscriptionId: item.id, body: formData },
        {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        },
      )
    })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("edit.title")}
      icon={Edit}
      maxWidth="sm:max-w-md"
      saveAction={{ label: t("common:update"), onClick: handleSubmit }}
    >
      <HuemulFieldGroup className="py-2">
        {item?.days_before != null && (
          <HuemulField
            type="number"
            label={t("form.daysBefore")}
            name="days_before"
            value={formData.days_before ?? ""}
            onChange={(v) => handleChange("days_before", v ? Number(v) : undefined)}
            placeholder={t("form.daysBeforePlaceholder")}
            min={1}
          />
        )}

        <HuemulField
          type="switch"
          label={t("form.notifyInApp")}
          name="notify_in_app"
          value={formData.notify_in_app ?? false}
          onChange={(v) => handleChange("notify_in_app", Boolean(v))}
          labelFirst
        />

        <HuemulField
          type="switch"
          label={t("form.notifyEmail")}
          name="notify_email"
          value={formData.notify_email ?? false}
          onChange={(v) => handleChange("notify_email", Boolean(v))}
          labelFirst
        />

        <HuemulField
          type="switch"
          label={t("form.requireReadAck")}
          name="require_read_ack"
          value={formData.require_read_ack ?? false}
          onChange={(v) => handleChange("require_read_ack", Boolean(v))}
          labelFirst
        />

        <HuemulField
          type="textarea"
          label={t("form.comment")}
          name="comment"
          value={formData.comment ?? ""}
          onChange={(v) => handleChange("comment", String(v) || undefined)}
          placeholder={t("form.commentPlaceholder")}
          rows={3}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
