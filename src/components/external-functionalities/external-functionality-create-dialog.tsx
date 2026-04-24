"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { useExternalFunctionalityMutations } from "@/hooks/useExternalFunctionalities"
import { ExternalFunctionalityForm, type ExternalFunctionalityFormData } from "./external-functionality-form"
import type { CreateExternalFunctionalityRequest } from "@/types/external-functionalities"

interface ExternalFunctionalityCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  onSuccess?: () => void
}

const INITIAL_FORM: CreateExternalFunctionalityRequest = {
  name: "",
  description: "",
  usage_example: "",
  partial_url: "",
  storage_url: "",
  http_method: "GET",
  objective: "import_asset",
  body: "",
  execution_type: "sync",
  functionality_class: "endpoint",
}

export function ExternalFunctionalityCreateDialog({
  open,
  onOpenChange,
  organizationId,
  systemId,
  onSuccess,
}: ExternalFunctionalityCreateDialogProps) {
  const { t } = useTranslation(["external-functionalities", "common"])
  const [formData, setFormData] = useState<CreateExternalFunctionalityRequest>(INITIAL_FORM)
  const { createExternalFunctionality } = useExternalFunctionalityMutations(organizationId, systemId)

  const handleChange = <K extends keyof ExternalFunctionalityFormData>(
    field: K,
    value: ExternalFunctionalityFormData[K],
  ) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    await new Promise<void>((resolve, reject) => {
      createExternalFunctionality.mutate(formData, {
        onSuccess: () => {
          setFormData(INITIAL_FORM)
          onSuccess?.()
          resolve()
        },
        onError: (err) => reject(err),
      })
    })
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("create.title")}
      icon={Plus}
      maxWidth="sm:max-w-2xl"
      saveAction={{
        label: t("create.submitLabel"),
        onClick: handleSubmit,
      }}
    >
      <ExternalFunctionalityForm formData={formData} onChange={handleChange} />
    </HuemulDialog>
  )
}
