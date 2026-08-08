import { useState, useEffect } from "react"
import { Blocks, ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import type { CreateLLMProviderRequest, CreateProviderDialogProps, SupportedProvider } from "@/types/llm-provider"
import { isMultilineKeyProvider, getProviderHelpUrl, isCredentialsHelpUrl } from "./provider-key-hints"
export type { CreateProviderDialogProps } from "@/types/llm-provider"

export function CreateProviderDialog({
  open,
  onOpenChange,
  supportedProviders,
  onSubmit,
  isCreating,
}: CreateProviderDialogProps) {
  const [name, setName] = useState("")
  const [isManaged, setIsManaged] = useState(false)
  const [selectedType, setSelectedType] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [deployment, setDeployment] = useState("")

  const selectedProvider = supportedProviders.find((p) => p.type === selectedType)
  const { t } = useTranslation('models')

  const resetForm = () => {
    setName("")
    setIsManaged(false)
    setSelectedType("")
    setApiKey("")
    setEndpoint("")
    setDeployment("")
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  const handleSave = async () => {
    const data: CreateLLMProviderRequest = {
      name,
      type: selectedType,
      is_managed: isManaged,
    }

    if (selectedProvider?.requires_api_key) {
      data.key = apiKey
    }
    if (selectedProvider?.requires_endpoint) {
      data.endpoint = endpoint
    }
    if (selectedProvider?.requires_deployment) {
      data.deployment = deployment
    }

    onSubmit(data)
  }

  const isFormValid =
    name.trim() !== "" &&
    selectedType !== "" &&
    (!selectedProvider?.requires_api_key || apiKey.trim() !== "") &&
    (!selectedProvider?.requires_endpoint || endpoint.trim() !== "") &&
    (!selectedProvider?.requires_deployment || deployment.trim() !== "")

  const typeOptions = supportedProviders.map((p) => ({
    label: p.display_name,
    value: p.type,
  }))

  const helpLinkAction = (supportedProvider: SupportedProvider | undefined) => {
    const url = getProviderHelpUrl(supportedProvider)
    if (!url) return undefined
    return {
      icon: ExternalLink,
      onClick: () => window.open(url, '_blank', 'noopener,noreferrer'),
      tooltip: isCredentialsHelpUrl(supportedProvider) ? t('createProviderDialog.getCredentials') : t('createProviderDialog.viewDocs'),
    }
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('createProviderDialog.title')}
      description={t('createProviderDialog.description')}
      icon={Blocks}
      saveAction={{
        label: isCreating ? t('common:creating') : t('createProviderDialog.createProvider'),
        onClick: handleSave,
        disabled: !isFormValid || isCreating,
        loading: isCreating,
        closeOnSuccess: false,
      }}
    >
      <HuemulFieldGroup gap="gap-4">
        <HuemulField
          label={t('common:name')}
          name="providerName"
          placeholder={t('createProviderDialog.namePlaceholder')}
          value={name}
          onChange={(v) => setName(String(v))}
          required
        />

        <HuemulField
          type="switch"
          label={t('createProviderDialog.managedLabel')}
          name="isManaged"
          value={isManaged}
          onChange={(v) => setIsManaged(Boolean(v))}
          description={t('createProviderDialog.managedDescription')}
        />

        <HuemulField
          type="select"
          label={t('createProviderDialog.typeLabel')}
          name="providerType"
          placeholder={t('createProviderDialog.typePlaceholder')}
          options={typeOptions}
          value={selectedType}
          onChange={(v) => {
            setSelectedType(String(v))
            setApiKey("")
            setEndpoint("")
            setDeployment("")
          }}
          required
        />

        {selectedProvider?.requires_api_key && (
          <HuemulField
            label={t('createProviderDialog.apiKeyLabel')}
            name="apiKey"
            type={isMultilineKeyProvider(selectedProvider.type) ? "textarea" : "password"}
            placeholder={t('createProviderDialog.apiKeyPlaceholder')}
            description={t(`createProviderDialog.keyHelp.${selectedProvider.type}`, { defaultValue: '' }) || undefined}
            value={apiKey}
            onChange={(v) => setApiKey(String(v))}
            required
            {...(helpLinkAction(selectedProvider) ? { labelAction: helpLinkAction(selectedProvider) } : {})}
          />
        )}

        {selectedProvider?.requires_endpoint && (
          <HuemulField
            label={t('createProviderDialog.endpointLabel')}
            name="endpoint"
            type="password"
            placeholder="https://api.example.com/v1"
            value={endpoint}
            onChange={(v) => setEndpoint(String(v))}
            required
            {...(helpLinkAction(selectedProvider) ? { labelAction: helpLinkAction(selectedProvider) } : {})}
          />
        )}

        {selectedProvider?.requires_deployment && (
          <HuemulField
            label={t('createProviderDialog.deploymentLabel')}
            name="deployment"
            type="password"
            placeholder={t('createProviderDialog.deploymentPlaceholder')}
            value={deployment}
            onChange={(v) => setDeployment(String(v))}
            required
            {...(helpLinkAction(selectedProvider) ? { labelAction: helpLinkAction(selectedProvider) } : {})}
          />
        )}
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
