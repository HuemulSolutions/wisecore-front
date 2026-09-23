import { useEffect, useState } from "react"
import { Blocks } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { LLM_CAPABILITIES } from "@/lib/llm-capabilities"
import { modelIdentifierPlaceholder } from "@/lib/llm-provider-ui"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulNotice } from "@/huemul/components/huemul-notice"
import { HuemulSheetField, HuemulSheetInput } from "@/huemul/components/huemul-sheet-field"
import { ModelsProviderAvatar } from "@/components/llm/models-provider-avatar"
import type { ModelSheetProps } from "@/types/models"
export type { ModelSheetProps } from "@/types/models"

const DEFAULT_CAPABILITIES = ['text_input', 'text_output']

type ModelFormErrors = Partial<Record<'provider' | 'name' | 'internalName' | 'capabilities' | 'inputPrice' | 'outputPrice', string>>

/** Precio opcional: vacío → sin tarifa (`null`), inválido → `undefined`. */
function parsePrice(value: string): number | null | undefined {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

export function ModelSheet({
  open,
  onOpenChange,
  model,
  providers,
  isFirstModel,
  isSaving,
  onSubmit,
  onConnectProvider,
  canSave,
}: ModelSheetProps) {
  const { t } = useTranslation('models')
  const isEdit = !!model

  const [providerId, setProviderId] = useState('')
  const [name, setName] = useState('')
  const [internalName, setInternalName] = useState('')
  const [capabilities, setCapabilities] = useState<string[]>(DEFAULT_CAPABILITIES)
  const [inputPrice, setInputPrice] = useState('')
  const [outputPrice, setOutputPrice] = useState('')
  const [errors, setErrors] = useState<ModelFormErrors>({})

  // Cargar/limpiar el formulario cada vez que el sheet se abre.
  useEffect(() => {
    if (!open) return
    setErrors({})
    if (model) {
      setProviderId(model.provider_id)
      setName(model.name)
      setInternalName(model.internal_name)
      setCapabilities(model.capabilities ?? [])
      setInputPrice(model.input_price_per_1m_tokens != null ? String(model.input_price_per_1m_tokens) : '')
      setOutputPrice(model.output_price_per_1m_tokens != null ? String(model.output_price_per_1m_tokens) : '')
    } else {
      setProviderId(providers.length === 1 ? providers[0].id : '')
      setName('')
      setInternalName('')
      setCapabilities(DEFAULT_CAPABILITIES)
      setInputPrice('')
      setOutputPrice('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, model])

  const selectedProvider = providers.find((p) => p.id === providerId)
  const providerType = selectedProvider?.type ?? model?.provider?.type

  const internalNameHelp =
    providerType === 'azure_ai_foundry'
      ? t('modelSheet.internalNameHelpFoundry')
      : providerType?.includes('azure')
        ? t('modelSheet.internalNameHelpAzure')
        : t('modelSheet.internalNameHelp')

  const toggleCapability = (cap: string) =>
    setCapabilities((prev) => (prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]))

  const handleSave = () => {
    if (!canSave) return

    const parsedInput = parsePrice(inputPrice)
    const parsedOutput = parsePrice(outputPrice)
    const nextErrors: ModelFormErrors = {}
    if (!providerId) nextErrors.provider = t('modelSheet.errors.provider')
    if (!name.trim()) nextErrors.name = t('modelSheet.errors.displayName')
    if (!internalName.trim()) nextErrors.internalName = t('modelSheet.errors.internalName')
    if (capabilities.length === 0) nextErrors.capabilities = t('modelSheet.errors.capabilities')
    if (parsedInput === undefined) nextErrors.inputPrice = t('modelSheet.errors.price')
    if (parsedOutput === undefined) nextErrors.outputPrice = t('modelSheet.errors.price')

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSubmit({
      name: name.trim(),
      internal_name: internalName.trim(),
      capabilities,
      provider_id: providerId,
      input_price_per_1m_tokens: parsedInput ?? null,
      output_price_per_1m_tokens: parsedOutput ?? null,
    })
  }

  if (!canSave) return null

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? t('modelSheet.editTitle') : t('modelSheet.createTitle')}
      description={t('modelSheet.subtitle')}
      icon={Blocks}
      iconVariant="tile"
      maxWidth="w-full sm:w-[480px] sm:max-w-[480px]"
      saveAction={{
        label: isEdit ? t('modelSheet.saveChanges') : t('modelSheet.save'),
        onClick: handleSave,
        loading: isSaving,
        closeOnSuccess: false,
        disabled: providers.length === 0,
      }}
    >
      <div className="flex flex-col gap-5 py-3">
        {/* Proveedor */}
        <HuemulSheetField label={t('modelSheet.providerLabel')} help={t('modelSheet.providerHelp')} error={errors.provider}>
          {providers.length === 0 ? (
            <HuemulNotice
              tone="amber"
              action={
                <button
                  type="button"
                  onClick={onConnectProvider}
                  className="rounded-[8px] border border-[#f5deb0] bg-white px-2.5 py-1 text-xs font-semibold text-[#8a5a00] hover:cursor-pointer hover:bg-[#fff6dc]"
                >
                  {t('modelSheet.connectProvider')}
                </button>
              }
            >
              {t('modelSheet.noProviders')}
            </HuemulNotice>
          ) : (
            <div role="radiogroup" className="flex flex-col gap-1.5">
              {providers.map((provider) => {
                const active = provider.id === providerId
                return (
                  <button
                    key={provider.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setProviderId(provider.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[10px] border px-3 py-2 text-left transition-colors hover:cursor-pointer",
                      active ? "border-[#2563eb] bg-[#f5f9ff]" : errors.provider ? "border-[#f3a19a]" : "border-[#dfe4ec] hover:border-[#93b4f5]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border",
                        active ? "border-[#2563eb]" : "border-[#c3ccd8]",
                      )}
                    >
                      {active && <span className="size-2 rounded-full bg-[#2563eb]" />}
                    </span>
                    <ModelsProviderAvatar type={provider.type} size="sm" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-[13px] font-semibold text-[#0f172a]">{provider.name}</span>
                      <span className="truncate text-[11.5px] text-[#7c8798]">{provider.display_name}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </HuemulSheetField>

        {/* Nombre visible */}
        <HuemulSheetField
          label={t('modelSheet.displayNameLabel')}
          help={t('modelSheet.displayNameHelp')}
          error={errors.name}
          htmlFor="model-name"
        >
          <HuemulSheetInput
            id="model-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('modelSheet.displayNamePlaceholder')}
            hasError={!!errors.name}
          />
        </HuemulSheetField>

        {/* Identificador */}
        <HuemulSheetField
          label={t('modelSheet.internalNameLabel')}
          help={internalNameHelp}
          error={errors.internalName}
          htmlFor="model-internal-name"
        >
          <HuemulSheetInput
            id="model-internal-name"
            mono
            value={internalName}
            onChange={(e) => setInternalName(e.target.value)}
            placeholder={modelIdentifierPlaceholder(providerType) ?? t('modelSheet.internalNamePlaceholder')}
            hasError={!!errors.internalName}
          />
        </HuemulSheetField>

        {/* Capacidades */}
        <HuemulSheetField label={t('modelSheet.capabilitiesLabel')} help={t('modelSheet.capabilitiesHelp')} error={errors.capabilities}>
          <div className="grid grid-cols-2 gap-2">
            {LLM_CAPABILITIES.map((cap) => {
              const checked = capabilities.includes(cap)
              return (
                <button
                  key={cap}
                  type="button"
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggleCapability(cap)}
                  className={cn(
                    "flex items-start gap-2 rounded-[10px] border p-2.5 text-left transition-colors hover:cursor-pointer",
                    checked ? "border-[#2563eb] bg-[#f5f9ff]" : errors.capabilities ? "border-[#f3a19a]" : "border-[#dfe4ec] hover:border-[#93b4f5]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[5px] border text-[10px] font-bold text-white",
                      checked ? "border-[#2563eb] bg-[#2563eb]" : "border-[#c3ccd8] bg-white",
                    )}
                  >
                    {checked && '✓'}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[12.5px] font-semibold text-[#0f172a]">{t(`capabilities.${cap}.label`)}</span>
                    <span className="text-[11.5px] leading-snug text-[#7c8798]">{t(`capabilities.${cap}.description`)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </HuemulSheetField>

        {/* Precio */}
        <div className="flex flex-col gap-2">
          <span className="text-[12.5px] font-semibold text-[#0f172a]">{t('modelSheet.priceLabel')}</span>
          <div className="grid grid-cols-2 gap-3">
            <HuemulSheetField label={t('modelSheet.inputPriceLabel')} error={errors.inputPrice} htmlFor="model-input-price">
              <HuemulSheetInput
                id="model-input-price"
                mono
                prefix="US$"
                inputMode="decimal"
                value={inputPrice}
                onChange={(e) => setInputPrice(e.target.value)}
                placeholder="2.50"
                hasError={!!errors.inputPrice}
              />
            </HuemulSheetField>
            <HuemulSheetField label={t('modelSheet.outputPriceLabel')} error={errors.outputPrice} htmlFor="model-output-price">
              <HuemulSheetInput
                id="model-output-price"
                mono
                prefix="US$"
                inputMode="decimal"
                value={outputPrice}
                onChange={(e) => setOutputPrice(e.target.value)}
                placeholder="10"
                hasError={!!errors.outputPrice}
              />
            </HuemulSheetField>
          </div>
          <p className="text-xs text-[#7c8798]">{t('modelSheet.priceHelp')}</p>
        </div>

        {!isEdit && isFirstModel && <HuemulNotice tone="amber">{t('modelSheet.firstModelNotice')}</HuemulNotice>}
      </div>
    </HuemulSheet>
  )
}
