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
  mode,
  editing,
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
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [deployment, setDeployment] = useState('')
  const [errors, setErrors] = useState<EmbeddingFormErrors>({})

  const isEdit = mode === 'edit' && !!editing
  // Editando: mismo tipo = puede dejar la clave vacía (se conserva); otro tipo = credenciales nuevas.
  const isSameType = isEdit && editing.name === name
  const isAzure = embeddingProviderRequiresAzureFields(name)

  useEffect(() => {
    if (!open) return
    setName(initialName)
    setLabel(mode === 'edit' ? (editing?.label ?? '') : '')
    setApiKey('') // la clave es write-only: nunca se prellena
    setEndpoint('')
    setDeployment('')
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialName, mode, editing?.id])

  const handleNameChange = (next: EmbeddingProviderName) => {
    setName(next)
    setApiKey('')
    setEndpoint('')
    setDeployment('')
    setErrors({})
  }

  const handleSave = () => {
    if (!canSave) return

    // Con el mismo tipo, endpoint/deployment vacíos también conservan lo guardado (no se exponen).
    const credentialsTouched = !!(apiKey.trim() || endpoint.trim() || deployment.trim())
    const needsCredentials = !isSameType || (isAzure && credentialsTouched)
    const nextErrors: EmbeddingFormErrors = {}
    if (!isSameType && !apiKey.trim()) nextErrors.apiKey = t('embeddingSheet.errors.apiKey')
    if (isAzure && needsCredentials && !endpoint.trim()) nextErrors.endpoint = t('embeddingSheet.errors.endpoint')
    if (isAzure && needsCredentials && !deployment.trim()) nextErrors.deployment = t('embeddingSheet.errors.deployment')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    if (isEdit) {
      const payload: UpdateEmbeddingProviderRequest = {}
      if ((editing.label ?? '') !== label.trim()) payload.label = label.trim()
      if (!isSameType) payload.name = name
      // La clave solo viaja si se escribió una nueva.
      if (apiKey.trim()) payload.key = apiKey.trim()
      if (isAzure && endpoint.trim()) payload.endpoint = endpoint.trim()
      if (isAzure && deployment.trim()) payload.deployment = deployment.trim()
      onSubmit({ mode: 'edit', providerId: editing.id, payload })
      return
    }

    const credentials = isAzure
      ? { name: 'azure_openai' as const, key: apiKey.trim(), endpoint: endpoint.trim(), deployment: deployment.trim() }
      : { name: 'openai' as const, key: apiKey.trim() }
    if (mode === 'add') {
      onSubmit({ mode: 'add', payload: { ...credentials, label: label.trim() || undefined } })
      return
    }
    onSubmit({ mode: 'create', payload: credentials })
  }

  if (!canSave) return null

  // Solo se prueba lo guardado: un proveedor existente y sin cambio de tipo.
  const testDisabled = !canTest || !isSameType || testState === 'testing'
  const title = isEdit ? t('embeddingSheet.editTitle') : mode === 'add' ? t('embeddingSheet.addTitle') : t('embeddingSheet.createTitle')

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
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
        <span title={!isSameType ? t('embeddingSheet.testDisabled') : undefined} className="inline-flex">
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

        {mode === 'add' && <HuemulNotice tone="blue">{t('embeddingSheet.addNotice')}</HuemulNotice>}
        {isEdit && !isSameType && <HuemulNotice tone="amber">{t('embeddingSheet.typeChangeNotice')}</HuemulNotice>}

        {mode !== 'create' && (
          <HuemulSheetField label={t('embeddingSheet.labelLabel')} help={t('embeddingSheet.labelHelp')} htmlFor="embedding-label">
            <HuemulSheetInput
              id="embedding-label"
              value={label}
              maxLength={120}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('embeddingSheet.labelPlaceholder')}
            />
          </HuemulSheetField>
        )}

        <HuemulSheetField
          label={t('embeddingSheet.apiKeyLabel')}
          help={isSameType ? t('embeddingSheet.apiKeySavedHelp') : t('embeddingSheet.apiKeyHelp')}
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
            placeholder={isSameType ? t('embeddingSheet.apiKeySavedPlaceholder') : undefined}
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
                placeholder={isSameType ? t('embeddingSheet.apiKeySavedPlaceholder') : t('embeddingSheet.endpointPlaceholder')}
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
                placeholder={isSameType ? t('embeddingSheet.apiKeySavedPlaceholder') : t('embeddingSheet.deploymentPlaceholder')}
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
