"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Edit } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useExternalSystemMutations } from "@/hooks/useExternalSystems"
import type {
  ExternalSystem,
  UpdateExternalSystemRequest,
  ExternalSystemStatus,
} from "@/types/external-systems"

interface ExternalSystemEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  system: ExternalSystem | null
}

export function ExternalSystemEditDialog({
  open,
  onOpenChange,
  organizationId,
  system,
}: ExternalSystemEditDialogProps) {
  const { t } = useTranslation(["external-systems", "common"])
  const [formData, setFormData] = useState<UpdateExternalSystemRequest>({
    name: "",
    base_url: "",
    status: "active",
  })
  const { updateExternalSystem } = useExternalSystemMutations(organizationId)

  useEffect(() => {
    if (system && open) {
      setFormData({ name: system.name, base_url: system.base_url, status: system.status })
    }
  }, [system, open])

  const statusOptions = [
    { value: "active", label: t("common:active") },
    { value: "inactive", label: t("common:inactive") },
  ]

  const handleChange = <K extends keyof UpdateExternalSystemRequest>(
    field: K,
    value: UpdateExternalSystemRequest[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!system) return
    await new Promise<void>((resolve, reject) => {
      updateExternalSystem.mutate(
        { systemId: system.id, body: formData },
        { onSuccess: () => resolve(), onError: (err) => reject(err) },
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
      saveAction={{
        label: t("common:update"),
        onClick: handleSubmit,
      }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t("columns.name")}
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
          label={t("columns.status")}
          name="status"
          value={formData.status}
          options={statusOptions}
          onChange={(v) => handleChange("status", v as ExternalSystemStatus)}
          placeholder={t("form.statusPlaceholder")}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
