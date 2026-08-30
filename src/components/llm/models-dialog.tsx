import { useState, useEffect } from "react"
import { Plus, Edit } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { ModelDialogProps } from "@/types/models"
export type { ModelDialogProps } from "@/types/models"
import { LLM_CAPABILITIES } from "@/lib/llm-capabilities"

export function ModelDialog({
  open,
  onOpenChange,
  model,
  providerName,
  providers,
  isCreating,
  isUpdating,
  onSubmit,
  canSave,
}: ModelDialogProps) {
  const isEdit = !!model
  const { t } = useTranslation('models')
  const [displayName, setDisplayName] = useState('')
  const [technicalName, setTechnicalName] = useState('')
  const [capabilities, setCapabilities] = useState<string[]>(['text_input'])
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [inputPrice, setInputPrice] = useState<number | ''>('')
  const [outputPrice, setOutputPrice] = useState<number | ''>('')

  useEffect(() => {
    if (model && open) {
      setDisplayName(model.name || '')
      setTechnicalName(model.internal_name || '')
      setInputPrice(model.input_price_per_1m_tokens ?? '')
      setOutputPrice(model.output_price_per_1m_tokens ?? '')
    }
  }, [model, open])

  useEffect(() => {
    if (!open) {
      setDisplayName('')
      setTechnicalName('')
      setCapabilities(['text_input'])
      setSelectedProviderId(providers?.[0]?.id ?? '')
      setInputPrice('')
      setOutputPrice('')
    }
  }, [open])

  useEffect(() => {
    if (open && !isEdit && providers && providers.length > 0 && !selectedProviderId) {
      setSelectedProviderId(providers[0].id)
    }
  }, [open, isEdit, providers])

  const toggleCapability = (cap: string) => {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    )
  }

  const isSubmitting = isCreating || isUpdating

  const handleSave = () => {
    if (!canSave) return
    onSubmit({
      name: displayName,
      internal_name: technicalName,
      capabilities,
      provider_id: selectedProviderId || undefined,
      input_price_per_1m_tokens: inputPrice === '' ? null : Number(inputPrice),
      output_price_per_1m_tokens: outputPrice === '' ? null : Number(outputPrice),
    })
  }

  const resolvedProviderName = providerName ?? providers?.find(p => p.id === selectedProviderId)?.name
  const resolvedProviderType = providers?.find(p => p.id === selectedProviderId)?.type ?? model?.provider?.type
  const technicalNameHelp = resolvedProviderType
    ? t(`modelDialog.technicalNameHelp.${resolvedProviderType}`, { defaultValue: t('modelDialog.technicalNameDescription') })
    : t('modelDialog.technicalNameDescription')

  // Los precios son opcionales: solo se valida que, si vienen, no sean negativos.
  const arePricesValid =
    (inputPrice === '' || inputPrice >= 0) &&
    (outputPrice === '' || outputPrice >= 0)

  const isFormValid =
    displayName.trim() !== '' &&
    technicalName.trim() !== '' &&
    arePricesValid &&
    (!isEdit ? capabilities.length > 0 && (!!providerName || !!selectedProviderId) : true)

  if (!canSave) return null

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('modelDialog.editTitle', { name: model?.name }) : t('modelDialog.createTitle', { provider: resolvedProviderName ?? '' })}
      description={isEdit ? t('modelDialog.editDescription') : t('modelDialog.createDescription', { provider: resolvedProviderName ?? '' })}
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
        {!isEdit && providers && providers.length > 0 && (
          <HuemulField
            label={t('modelDialog.providerLabel')}
            name="provider"
            type="select"
            value={selectedProviderId}
            onChange={(v) => setSelectedProviderId(String(v))}
            options={providers.map(p => ({ label: p.name, value: p.id }))}
            placeholder={t('modelDialog.providerPlaceholder')}
            disabled={isSubmitting}
            required
          />
        )}
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
          description={technicalNameHelp}
          disabled={isSubmitting}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <HuemulField
            type="number"
            label={t('modelDialog.inputPriceLabel')}
            name="inputPrice"
            value={inputPrice}
            onChange={(v) => setInputPrice(v === '' ? '' : Number(v))}
            placeholder={t('modelDialog.pricePlaceholder')}
            description={t('modelDialog.priceDescription')}
            allowDecimal
            min={0}
            disabled={isSubmitting}
          />
          <HuemulField
            type="number"
            label={t('modelDialog.outputPriceLabel')}
            name="outputPrice"
            value={outputPrice}
            onChange={(v) => setOutputPrice(v === '' ? '' : Number(v))}
            placeholder={t('modelDialog.pricePlaceholder')}
            description={t('modelDialog.priceDescription')}
            allowDecimal
            min={0}
            disabled={isSubmitting}
          />
        </div>
        {!isEdit && (
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">{t('modelDialog.capabilitiesLabel')}</Label>
            <p className="text-xs text-muted-foreground">{t('capabilitiesDialog.description')}</p>
            <div className="space-y-2 mt-1">
              {LLM_CAPABILITIES.map((cap) => (
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