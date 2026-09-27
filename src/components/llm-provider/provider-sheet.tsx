import { useEffect, useState } from "react"
import { ChevronRight, Plug, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulNotice } from "@/huemul/components/huemul-notice"
import { HuemulSheetField, HuemulSheetInput, HuemulSheetTextarea } from "@/huemul/components/huemul-sheet-field"
import { ModelsProviderAvatar } from "@/components/llm/models-provider-avatar"
import { Button } from "@/components/ui/button"
import { getProviderHelpUrl, isMultilineKeyProvider } from "@/components/llm-provider/provider-key-hints"
import type { CreateLLMProviderRequest, ProviderSheetProps, SupportedProvider } from "@/types/llm-provider"
export type { ProviderSheetProps } from "@/types/llm-provider"

type ProviderFormErrors = Partial<Record<'name' | 'apiKey' | 'endpoint' | 'deployment', string>>

export function ProviderSheet({
  open,
  onOpenChange,
  provider,
  supportedProviders,
  modelCount,
  isSaving,
  onSubmit,
  onDelete,
  canSave,
  canDelete,
}: ProviderSheetProps) {
  const { t } = useTranslation('models')
  const isEdit = !!provider

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState('')
  const [name, setName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [endpoint, setEndpoint] = useState('')
  const [deployment, setDeployment] = useState('')
  const [errors, setErrors] = useState<ProviderFormErrors>({})
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setApiKey('') // la clave es write-only: nunca se prellena
    if (provider) {
      setStep(2)
      setSelectedType(provider.type)
      setName(provider.name)
      setEndpoint(provider.endpoint ?? '')
      setDeployment(provider.deployment ?? '')
    } else {
      setStep(1)
      setSelectedType('')
      setName('')
      setEndpoint('')
      setDeployment('')
    }
  }, [open, provider])

  const supported: SupportedProvider | undefined = supportedProviders.find((p) => p.type === selectedType)
  const isManaged = provider?.is_managed ?? false
  const helpUrl = getProviderHelpUrl(supported)
  const multiline = isMultilineKeyProvider(supported?.type)

  const chooseType = (item: SupportedProvider) => {
    setSelectedType(item.type)
    setName(item.display_name)
    setApiKey('')
    setEndpoint('')
    setDeployment('')
    setErrors({})
    setStep(2)
  }

  const describeNeeds = (item: SupportedProvider) => {
    if (item.requires_endpoint && item.requires_deployment) return t('providerSheet.needsFull')
    if (item.requires_endpoint) return t('providerSheet.needsKeyEndpoint')
    return t('providerSheet.needsKey')
  }

  const handleSave = () => {
    if (!canSave || !supported) return

    const nextErrors: ProviderFormErrors = {}
    if (!name.trim()) nextErrors.name = t('providerSheet.errors.name')
    if (supported.requires_api_key && !isEdit && !apiKey.trim()) nextErrors.apiKey = t('providerSheet.errors.apiKey')
    if (supported.requires_endpoint && !endpoint.trim()) nextErrors.endpoint = t('providerSheet.errors.endpoint')
    if (supported.requires_deployment && !deployment.trim()) nextErrors.deployment = t('providerSheet.errors.deployment')

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const data: CreateLLMProviderRequest = {
      name: name.trim(),
      type: supported.type,
      is_managed: provider?.is_managed ?? false,
    }
    // PUT reemplaza el recurso: la clave solo viaja si se escribió una nueva.
    if (supported.requires_api_key && apiKey.trim() !== '') data.key = apiKey
    if (supported.requires_endpoint) data.endpoint = endpoint.trim()
    if (supported.requires_deployment) data.deployment = deployment.trim()
    onSubmit(data)
  }

  if (!canSave && !isEdit) return null

  const helpLink = helpUrl && (
    <a
      href={helpUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs font-medium text-[#2563eb] hover:text-[#1d4ed8] hover:underline"
    >
      {t('providerSheet.whereToFind')}
    </a>
  )

  const showSave = step === 2 && !isManaged && canSave

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={isEdit ? t('providerSheet.editTitle') : t('providerSheet.createTitle')}
        description={t('providerSheet.subtitle')}
        icon={Plug}
        iconVariant="tile"
        maxWidth="w-full sm:w-[480px] sm:max-w-[480px]"
        saveAction={
          showSave
            ? {
                label: isEdit ? t('providerSheet.saveChanges') : t('providerSheet.connect'),
                onClick: handleSave,
                loading: isSaving,
                closeOnSuccess: false,
              }
            : undefined
        }
        footerLeft={
          isEdit && canDelete && !isManaged ? (
            <div className="flex flex-col items-start gap-1">
              <span title={modelCount > 0 ? t(modelCount === 1 ? 'providerSheet.usedByOne' : 'providerSheet.usedByMany', { count: modelCount }) : undefined}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={modelCount > 0}
                  className="text-destructive hover:cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="mr-1.5 size-3.5" />
                  {t('providerSheet.delete')}
                </Button>
              </span>
              {modelCount > 0 && (
                <span className="max-w-[220px] text-[11.5px] leading-snug text-[#7c8798]">
                  {t(modelCount === 1 ? 'providerSheet.usedByOne' : 'providerSheet.usedByMany', { count: modelCount })}
                </span>
              )}
            </div>
          ) : undefined
        }
      >
        {step === 1 ? (
          <div className="flex flex-col gap-3 py-3">
            <h3 className="text-[13.5px] font-semibold text-[#0f172a]">{t('providerSheet.step1Title')}</h3>
            <div className="flex flex-col gap-2">
              {supportedProviders.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => chooseType(item)}
                  className="flex items-center gap-3 rounded-[10px] border border-[#dfe4ec] bg-white px-3 py-2.5 text-left transition-colors hover:cursor-pointer hover:border-[#93b4f5]"
                >
                  <ModelsProviderAvatar type={item.type} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13.5px] font-semibold text-[#0f172a]">{item.display_name}</span>
                    <span className="truncate text-xs text-[#7c8798]">{describeNeeds(item)}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-[#b6c0cd]" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-3">
            {supported && (
              <div className="flex items-center gap-3 rounded-[10px] border border-[#e3e9f1] bg-[#f7f9fb] px-3 py-2.5">
                <ModelsProviderAvatar type={supported.type} />
                <span className="flex-1 truncate text-[13.5px] font-semibold text-[#0f172a]">{supported.display_name}</span>
                {!isEdit && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-medium text-[#2563eb] hover:cursor-pointer hover:text-[#1d4ed8] hover:underline"
                  >
                    {t('providerSheet.change')}
                  </button>
                )}
              </div>
            )}

            <HuemulSheetField
              label={t('providerSheet.nameLabel')}
              help={t('providerSheet.nameHelp')}
              error={errors.name}
              htmlFor="provider-name"
            >
              <HuemulSheetInput
                id="provider-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('providerSheet.namePlaceholder')}
                disabled={isManaged}
                hasError={!!errors.name}
              />
            </HuemulSheetField>

            {isManaged ? (
              <HuemulNotice tone="blue">{t('providerSheet.managedNotice')}</HuemulNotice>
            ) : (
              <>
                {supported?.requires_api_key && (
                  <HuemulSheetField
                    label={t('providerSheet.apiKeyLabel')}
                    labelAction={helpLink}
                    help={
                      isEdit
                        ? t('providerSheet.apiKeySavedHelp')
                        : multiline
                          ? t('providerSheet.apiKeyHelpMultiline')
                          : t('providerSheet.apiKeyHelp')
                    }
                    error={errors.apiKey}
                    htmlFor="provider-key"
                  >
                    {multiline ? (
                      <HuemulSheetTextarea
                        id="provider-key"
                        mono
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={isEdit ? t('providerSheet.apiKeySavedPlaceholder') : undefined}
                        hasError={!!errors.apiKey}
                      />
                    ) : (
                      <HuemulSheetInput
                        id="provider-key"
                        mono
                        type="password"
                        autoComplete="off"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={isEdit ? t('providerSheet.apiKeySavedPlaceholder') : undefined}
                        hasError={!!errors.apiKey}
                      />
                    )}
                  </HuemulSheetField>
                )}

                {supported?.requires_endpoint && (
                  <HuemulSheetField
                    label={t('providerSheet.endpointLabel')}
                    help={t('providerSheet.endpointHelp')}
                    error={errors.endpoint}
                    htmlFor="provider-endpoint"
                  >
                    <HuemulSheetInput
                      id="provider-endpoint"
                      mono
                      type="url"
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                      placeholder={t('providerSheet.endpointPlaceholder')}
                      hasError={!!errors.endpoint}
                    />
                  </HuemulSheetField>
                )}

                {supported?.requires_deployment && (
                  <HuemulSheetField
                    label={t('providerSheet.deploymentLabel')}
                    help={t('providerSheet.deploymentHelp')}
                    error={errors.deployment}
                    htmlFor="provider-deployment"
                  >
                    <HuemulSheetInput
                      id="provider-deployment"
                      mono
                      value={deployment}
                      onChange={(e) => setDeployment(e.target.value)}
                      placeholder={t('providerSheet.deploymentPlaceholder')}
                      hasError={!!errors.deployment}
                    />
                  </HuemulSheetField>
                )}
              </>
            )}
          </div>
        )}
      </HuemulSheet>

      {/* Confirmación de borrado: hermano del sheet, no anidado (danger-zone-sheet-guide) */}
      <HuemulAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t('providerSheet.deleteTitle')}
        description={t('providerSheet.deleteDescription', { name: provider?.name ?? '' })}
        actionLabel={t('table.confirmAccept')}
        onAction={onDelete}
      />
    </>
  )
}
