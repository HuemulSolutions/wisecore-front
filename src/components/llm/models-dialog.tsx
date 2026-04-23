import { useState, useEffect } from "react"
import { Plus, Edit } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { LLM } from "@/types/llm"

const ALL_CAPABILITIES = [
  'text_input',
  'text_output',
  'image_input',
  'image_output',
  'tool_use',
] as const

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
  const [capabilities, setCapabilities] = useState<string[]>(['text_input'])

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
      setCapabilities(['text_input'])
    }
  }, [open])

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    )
  }

  const isSubmitting = isCreating || isUpdating

  const handleSave = () => {
    onSubmit({ name: displayName, internal_name: technicalName, capabilities })
  }

  const isFormValid = displayName.trim() !== '' && technicalName.trim() !== '' && (!isEdit ? capabilities.length > 0 : true)

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('modelDialog.editTitle', { name: model?.name }) : t('modelDialog.createTitle', { provider: providerName })}
      description={isEdit ? t('modelDialog.editDescription') : t('modelDialog.createDescription', { provider: providerName })}
      icon={isEdit ? Edit : Plus}
      saveAction={{
        label: isSubmitting
          ? (isEdit ? t('common:updating') : t('common:saving'))
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
        {!isEdit && (
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">{t('modelDialog.capabilitiesLabel')}</Label>
            <p className="text-xs text-muted-foreground">{t('capabilitiesDialog.description')}</p>
            <div className="space-y-2 mt-1">
              {ALL_CAPABILITIES.map((cap) => (
                <div key={cap} className="flex items-center gap-3">
                  <Checkbox
                    id={`create-cap-${cap}`}
                    checked={capabilities.includes(cap)}
                    onCheckedChange={() => toggleCapability(cap)}
                    disabled={isSubmitting}
                    className="hover:cursor-pointer"
                  />
                  <Label
                    htmlFor={`create-cap-${cap}`}
                    className="text-sm hover:cursor-pointer select-none"
                  >
                    {t(`capabilitiesDialog.capabilities.${cap}`)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}