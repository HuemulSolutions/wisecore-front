"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Edit } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { useExternalFunctionalityMutations } from "@/hooks/useExternalFunctionalities"
import { ExternalFunctionalityForm } from "./external-functionality-form"
import type {
  ExternalFunctionality,
  UpdateExternalFunctionalityRequest,
} from "@/types/external-functionalities"

interface ExternalFunctionalityEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  functionality: ExternalFunctionality | null
}

export function ExternalFunctionalityEditDialog({
  open,
  onOpenChange,
  organizationId,
  systemId,
  functionality,
}: ExternalFunctionalityEditDialogProps) {
  const { t } = useTranslation(["external-functionalities", "common"])
  const [formData, setFormData] = useState<UpdateExternalFunctionalityRequest>({})
  const { updateExternalFunctionality } = useExternalFunctionalityMutations(organizationId, systemId)

  useEffect(() => {
    if (functionality && open) {
      setFormData({
        name: functionality.name,
        description: functionality.description,
        usage_example: functionality.usage_example,
        partial_url: functionality.partial_url,
        storage_url: functionality.storage_url,
        http_method: functionality.http_method,
        objective: functionality.objective,
        body: functionality.body,
        execution_type: functionality.execution_type,
        functionality_class: functionality.functionality_class,
      })
    }
  }, [functionality, open])

  const handleChange = <K extends keyof UpdateExternalFunctionalityRequest>(
    field: K,
    value: UpdateExternalFunctionalityRequest[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!functionality) return
    await new Promise<void>((resolve, reject) => {
      updateExternalFunctionality.mutate(
        { functionalityId: functionality.id, body: formData },
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
      maxWidth="sm:max-w-2xl"
      saveAction={{
        label: t("common:update"),
        onClick: handleSubmit,
      }}
    >
      <ExternalFunctionalityForm formData={formData} onChange={handleChange} />
    </HuemulDialog>
  )
}
