"use client"

import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { useAuthTypeMutations, useAuthTypeTypes } from "@/hooks/useAuthTypes"
import type { AuthType, UpdateAuthTypeRequest } from "@/services/auth-types"
import { Edit } from "lucide-react"

interface EditAuthTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  authType: AuthType | null
}

export function EditAuthTypeDialog({ open, onOpenChange, authType }: EditAuthTypeDialogProps) {
  const { t } = useTranslation(['auth-types', 'common'])
  const [formData, setFormData] = useState<UpdateAuthTypeRequest>({
    name: "",
    type: "internal",
    params: null,
  })

  const { data: authTypeTypes } = useAuthTypeTypes(open && !!authType)
  const { updateAuthType } = useAuthTypeMutations()

  useEffect(() => {
    if (authType && open) {
      setFormData({
        name: authType.name,
        type: authType.type,
        params: authType.params,
      })
    }
  }, [authType, open])

  const handleSubmit = async () => {
    if (!authType) return

    await new Promise<void>((resolve, reject) => {
      updateAuthType.mutate({ id: authType.id, data: formData }, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error)
      })
    })
  }

  const handleInputChange = (field: keyof UpdateAuthTypeRequest, value: any) => {
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
      title={t('editDialog.title')}
      icon={Edit}
      maxWidth="sm:max-w-sm"
      maxHeight="max-h-[90vh]"
      saveAction={{
        label: t('common:update'),
        onClick: handleSubmit,
      }}
    >
      <HuemulFieldGroup className="py-2">
        <HuemulField
          label={t('common:name')}
          name="name"
          value={formData.name}
          onChange={(value) => handleInputChange("name", value)}
          placeholder={t('editDialog.namePlaceholder')}
          required
        />
        <HuemulField
          type="select"
          label={t('columns.type')}
          name="type"
          value={formData.type}
          options={typeOptions}
          onChange={(value) => handleInputChange("type", value as "internal" | "entra")}
          placeholder={t('editDialog.typePlaceholder')}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}