"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useExternalSystemMutations } from "@/hooks/useExternalSystems"
import type { CreateExternalSystemRequest, ExternalSystemStatus } from "@/types/external-systems"
import type { ExternalSystemCreateSheetProps } from "@/types/external-systems"

export type { ExternalSystemCreateSheetProps } from "@/types/external-systems"

const INITIAL_FORM: CreateExternalSystemRequest = {
  name: "",
  base_url: "",
  status: "active",
}

export function ExternalSystemCreateSheet({
  open,
  onOpenChange,
  organizationId,
  canCreate,
}: ExternalSystemCreateSheetProps) {
  const { t } = useTranslation(["external-systems", "common"])
  const [formData, setFormData] = useState<CreateExternalSystemRequest>(INITIAL_FORM)
  const { createExternalSystem } = useExternalSystemMutations(organizationId)

  const statusOptions = [
    { value: "active", label: t("common:active") },
    { value: "inactive", label: t("common:inactive") },
  ]

  const handleChange = <K extends keyof CreateExternalSystemRequest>(
    field: K,
    value: CreateExternalSystemRequest[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!canCreate) return
    await new Promise<void>((resolve, reject) => {
      createExternalSystem.mutate(formData, {
        onSuccess: () => {
          setFormData(INITIAL_FORM)
          resolve()
        },
        onError: (err) => reject(err),
      })
    })
  }

  if (!canCreate) return null

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("create.title")}
      icon={Plus}
      maxWidth="sm:max-w-lg"
      cancelLabel={t("common:cancel")}
      saveAction={{
        label: t("create.submitLabel"),
        onClick: handleSubmit,
      }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t("common:name")}
          name="name"
          value={formData.name}
          onChange={(v) => handleChange("name", v as string)}
          placeholder={t("form.namePlaceholder")}
          required
        />
        <HuemulField
          label={t("columns.baseUrl")}
          name="base_url"
          type="url"
          value={formData.base_url}
          onChange={(v) => handleChange("base_url", v as string)}
          placeholder={t("form.baseUrlPlaceholder")}
          required
        />
        <HuemulField
          type="select"
          label={t("common:status")}
          name="status"
          value={formData.status}
          options={statusOptions}
          onChange={(v) => handleChange("status", v as ExternalSystemStatus)}
          placeholder={t("form.statusPlaceholder")}
        />
      </HuemulFieldGroup>
    </HuemulSheet>
  )
}
