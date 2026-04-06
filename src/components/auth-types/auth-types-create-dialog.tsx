"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useAuthTypeMutations, useAuthTypeTypes } from "@/hooks/useAuthTypes"
import type { CreateAuthTypeRequest } from "@/services/auth-types"
import { Plus } from "lucide-react"

interface CreateAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAuthTypeDialog({ open, onOpenChange }: CreateAuthTypeDialogProps) {
  const { t } = useTranslation(['auth-types', 'common'])
  const [formData, setFormData] = useState<CreateAuthTypeRequest>({
    name: "",
    type: "internal",
    params: null,
  })

  const { data: authTypeTypes } = useAuthTypeTypes(open)
  const { createAuthType } = useAuthTypeMutations()

  const handleSubmit = async () => {
    await new Promise<void>((resolve, reject) => {
      createAuthType.mutate(formData, {
        onSuccess: () => {
          setFormData({ name: "", type: "internal", params: null })
          resolve()
        },
        onError: (error) => reject(error)
      })
    })
  }

  const handleInputChange = (field: keyof CreateAuthTypeRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const typeOptions = (authTypeTypes ?? []).map((type) => ({
    value: type,
    label: type === "internal" ? t('types.internal') : type === "entra" ? t('types.entra') : type,
  }))

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('createDialog.title')}
      icon={Plus}
      maxWidth="sm:max-w-sm"
      maxHeight="max-h-[90vh]"
      saveAction={{
        label: t('common:create'),
        onClick: handleSubmit,
      }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t('common:name')}
          name="name"
          value={formData.name}
          onChange={(value) => handleInputChange("name", value)}
          placeholder={t('createDialog.namePlaceholder')}
          required
        />
        <HuemulField
          type="select"
          label={t('columns.type')}
          name="type"
          value={formData.type}
          options={typeOptions}
          onChange={(value) => handleInputChange("type", value as "internal" | "entra")}
          placeholder={t('createDialog.typePlaceholder')}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}