import { useState, useEffect } from "react"
import { Plus, Edit } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import type { LLM } from "@/types/llm"

interface ModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: LLM | null
  providerName?: string
  isCreating: boolean
  isUpdating: boolean
  onSubmit: (data: { name: string; internal_name: string; capabilities: string[] }) => void
}

export function ModelDialog({
  open,
  onOpenChange,
  model,
  providerName,
  isCreating,
  isUpdating,
  onSubmit
}: ModelDialogProps) {
  const isEdit = !!model
  const { t } = useTranslation('models')
  const [displayName, setDisplayName] = useState('')
  const [technicalName, setTechnicalName] = useState('')

  useEffect(() => {
    if (model && open) {
      setDisplayName(model.name || '')
      setTechnicalName(model.internal_name || '')
    }
  }, [model, open])

  useEffect(() => {
    if (!open) {
      setDisplayName('')
      setTechnicalName('')
    }
  }, [open])

  const isSubmitting = isCreating || isUpdating

  const handleSave = () => {
    onSubmit({ name: displayName, internal_name: technicalName, capabilities: ['text_generation'] })
  }

  const isFormValid = displayName.trim() !== '' && technicalName.trim() !== ''

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('modelDialog.editTitle', { name: model?.name }) : t('modelDialog.createTitle', { provider: providerName })}
      description={isEdit ? t('modelDialog.editDescription') : t('modelDialog.createDescription', { provider: providerName })}
      icon={isEdit ? Edit : Plus}
      saveAction={{
        label: isSubmitting
          ? (isEdit ? t('modelDialog.updating') : t('modelDialog.saving'))
          : (isEdit ? t('modelDialog.updateModel') : t('modelDialog.saveModel')),
        onClick: handleSave,
        disabled: !isFormValid || isSubmitting,
        loading: isSubmitting,
        closeOnSuccess: false,
      }}
    >
      <HuemulFieldGroup gap="gap-4">
        <HuemulField
          label={t('modelDialog.displayNameLabel')}
          name="displayName"
          placeholder={t('modelDialog.displayNamePlaceholder')}
          value={displayName}
          onChange={(v) => setDisplayName(String(v))}
          disabled={isSubmitting}
          required
        />
        <HuemulField
          label={t('modelDialog.technicalNameLabel')}
          name="technicalName"
          placeholder={t('modelDialog.technicalNamePlaceholder')}
          value={technicalName}
          onChange={(v) => setTechnicalName(String(v))}
          description={t('modelDialog.technicalNameDescription')}
          disabled={isSubmitting}
          required
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}