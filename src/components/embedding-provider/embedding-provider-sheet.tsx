import { useEffect, useState } from "react"
import { Check, Loader2, Radio, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulNotice } from "@/huemul/components/huemul-notice"
import { HuemulSegmentedControl } from "@/huemul/components/huemul-segmented-control"
import { HuemulSheetField, HuemulSheetInput } from "@/huemul/components/huemul-sheet-field"
import { Button } from "@/components/ui/button"
import { embeddingProviderRequiresAzureFields } from "@/lib/embedding-provider-options"
import type {
  EmbeddingProviderName,
  EmbeddingProviderSheetProps,
  UpdateEmbeddingProviderRequest,
} from "@/types/embedding-provider"
export type { EmbeddingProviderSheetProps } from "@/types/embedding-provider"

type EmbeddingFormErrors = Partial<Record<'apiKey' | 'endpoint' | 'deployment', string>>

export function EmbeddingProviderSheet({
  open,
  onOpenChange,
  configured,
  options,
  initialName,
  isSaving,
  testState,
  onTest,
  onSubmit,
  canTest,
  canSave,
}: EmbeddingProviderSheetProps) {
  const { t } = useTranslation('models')

  const [name, setName] = useState<EmbeddingProviderName>(initialName)
  const [apiKey, setApiKey] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [deployment, setDeployment] = useState('')
  const [errors, setErrors] = useState<EmbeddingFormErrors>({})

  // Editar el proveedor activo → PUT; elegir otro (o no tener) → POST.
  const isSameAsConfigured = !!configured && configured.name === name
  const isAzure = embeddingProviderRequiresAzureFields(name)

  useEffect(() => {
    if (!open) return
    setName(initialName)
    setApiKey('') // la clave es write-only: nunca se prellena
    setErrors({})
    const sameProvider = configured?.name === initialName
    setEndpoint(sameProvider ? (configured?.endpoint ?? '') : '')
    setDeployment(sameProvider ? (configured?.deployment ?? '') : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialName])

  const handleNameChange = (next: EmbeddingProviderName) => {
    setName(next)
    setApiKey('')
    setErrors({})
    const sameProvider = configured?.name === next
    setEndpoint(sameProvider ? (configured?.endpoint ?? '') : '')
    setDeployment(sameProvider ? (configured?.deployment ?? '') : '')
  }

  const activeOption = options.find((o) => o.isActive)
  const nextOption = options.find((o) => o.name === name)

  const handleSave = () => {
    if (!canSave) return

    const nextErrors: EmbeddingFormErrors = {}
    if (!isSameAsConfigured && !apiKey.trim()) nextErrors.apiKey = t('embeddingSheet.errors.apiKey')
    if (isAzure && !endpoint.trim()) nextErrors.endpoint = t('embeddingSheet.errors.endpoint')
    if (isAzure && !deployment.trim()) nextErrors.deployment = t('embeddingSheet.errors.deployment')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (isSameAsConfigured) {
      const payload: UpdateEmbeddingProviderRequest = { name }
      // La clave solo viaja si se escribió una nueva.
      if (apiKey.trim()) payload.key = apiKey
      if (isAzure) {
        payload.endpoint = endpoint.trim()
        payload.deployment = deployment.trim()
      }
      onSubmit({ mode: 'update', payload })
      return
    }

    onSubmit({
      mode: 'create',
      payload: isAzure
        ? { name: 'azure_openai', key: apiKey.trim(), endpoint: endpoint.trim(), deployment: deployment.trim() }
        : { name: 'openai', key: apiKey.trim() },
    })
  }

  if (!canSave) return null

  const testDisabled = !canTest || !isSameAsConfigured || testState === 'testing'

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={configured ? t('embeddingSheet.editTitle') : t('embeddingSheet.createTitle')}
      description={t('embeddingSheet.subtitle')}
      icon={Search}
      iconVariant="tile"
      maxWidth="w-full sm:w-[480px] sm:max-w-[480px]"
      saveAction={{
        label: t('embeddingSheet.save'),
        onClick: handleSave,
        loading: isSaving,
        closeOnSuccess: false,
      }}
      footerLeft={
        <span title={!isSameAsConfigured ? t('embeddingSheet.testDisabled') : undefined} className="inline-flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={testDisabled}
            onClick={onTest}
            className="hover:cursor-pointer"
          >
            {testState === 'testing' ? <Loader2 className="mr-1.5 size-3.5 animate-spin" /> : <Radio className="mr-1.5 size-3.5" />}
            {t('embeddingSheet.testConnection')}
          </Button>
        </span>
      }
    >
      <div className="flex flex-col gap-5 py-3">
        <HuemulSheetField label={t('embeddingSheet.providerLabel')}>
          <HuemulSegmentedControl<EmbeddingProviderName>
            ariaLabel={t('embeddingSheet.providerLabel')}
            value={name}
            options={options.map((o) => ({ value: o.name, label: o.display }))}
            onChange={handleNameChange}
          />
        </HuemulSheetField>

        {configured && !isSameAsConfigured && activeOption && nextOption && (
          <HuemulNotice tone="amber">
            {t('embeddingSheet.replaceNotice', { next: nextOption.display, current: activeOption.display })}
          </HuemulNotice>
        )}

        <HuemulSheetField
          label={t('embeddingSheet.apiKeyLabel')}
          help={isSameAsConfigured ? t('embeddingSheet.apiKeySavedHelp') : t('embeddingSheet.apiKeyHelp')}
          error={errors.apiKey}
          htmlFor="embedding-key"
        >
          <HuemulSheetInput
            id="embedding-key"
            mono
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={isSameAsConfigured ? t('embeddingSheet.apiKeySavedPlaceholder') : undefined}
            hasError={!!errors.apiKey}
          />
        </HuemulSheetField>

        {isAzure && (
          <>
            <HuemulSheetField
              label={t('embeddingSheet.endpointLabel')}
              help={t('embeddingSheet.endpointHelp')}
              error={errors.endpoint}
              htmlFor="embedding-endpoint"
            >
              <HuemulSheetInput
                id="embedding-endpoint"
                mono
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder={t('embeddingSheet.endpointPlaceholder')}
                hasError={!!errors.endpoint}
              />
            </HuemulSheetField>
            <HuemulSheetField
              label={t('embeddingSheet.deploymentLabel')}
              help={t('embeddingSheet.deploymentHelp')}
              error={errors.deployment}
              htmlFor="embedding-deployment"
            >
              <HuemulSheetInput
                id="embedding-deployment"
                mono
                value={deployment}
                onChange={(e) => setDeployment(e.target.value)}
                placeholder={t('embeddingSheet.deploymentPlaceholder')}
                hasError={!!errors.deployment}
              />
            </HuemulSheetField>
          </>
        )}

        {testState === 'testing' && (
          <p className="flex items-center gap-1.5 text-[12.5px] text-[#64748b]">
            <Loader2 className="size-3.5 animate-spin" />
            {t('embeddingSheet.testing')}
          </p>
        )}
        {testState === 'ok' && (
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#15803d]">
            <Check className="size-3.5" />
            {t('embeddingSheet.testOk')}
          </p>
        )}
        {testState === 'error' && <p className="text-[12.5px] font-medium text-[#d92d20]">{t('embeddingSheet.testError')}</p>}
      </div>
    </HuemulSheet>
  )
}
