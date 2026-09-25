import { useState, useEffect } from "react"
import { KeyRound, ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import type { CreateLLMProviderRequest, ProviderApiKeyDialogProps, SupportedProvider } from "@/types/llm-provider"
import { isMultilineKeyProvider, getProviderHelpUrl, isCredentialsHelpUrl } from "./provider-key-hints"
export type { ProviderApiKeyDialogProps } from "@/types/llm-provider"

export function ProviderApiKeyDialog({
  open,
  onOpenChange,
  provider,
  supportedProviders,
  onSubmit,
  isUpdating,
  canUpdate,
}: ProviderApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("")

  const { t } = useTranslation('models')

  const selectedProvider = supportedProviders.find((p) => p.type === provider?.type)

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setApiKey("")
    }
  }, [open])

  const handleSave = async () => {
    if (!provider || !canUpdate) return

    const data: CreateLLMProviderRequest = {
      name: provider.name,
      type: provider.type,
      is_managed: provider.is_managed,
      key: apiKey,
    }

    onSubmit(data)
  }

  const isFormValid = apiKey.trim() !== ""

  const helpLinkAction = (supportedProvider: SupportedProvider | undefined) => {
    const url = getProviderHelpUrl(supportedProvider)
    if (!url) return undefined
    return {
      icon: ExternalLink,
      onClick: () => window.open(url, '_blank', 'noopener,noreferrer'),
      tooltip: isCredentialsHelpUrl(supportedProvider) ? t('createProviderDialog.getCredentials') : t('createProviderDialog.viewDocs'),
    }
  }

  if (!provider || !canUpdate || !selectedProvider?.requires_api_key) return null

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('providerApiKeyDialog.title', { name: provider.display_name || provider.name })}
      description={t('providerApiKeyDialog.description', { name: provider.display_name || provider.name })}
      icon={KeyRound}
      saveAction={{
        label: isUpdating ? t('common:updating') : t('providerApiKeyDialog.save'),
        onClick: handleSave,
        disabled: !isFormValid || isUpdating,
        loading: isUpdating,
        closeOnSuccess: false,
      }}
    >
      <HuemulFieldGroup gap="gap-4">
        <HuemulField
          label={t('createProviderDialog.apiKeyLabel')}
          name="apiKey"
          type={isMultilineKeyProvider(selectedProvider.type) ? "textarea" : "password"}
          placeholder={t('createProviderDialog.apiKeyPlaceholder')}
          description={t('providerApiKeyDialog.help')}
          value={apiKey}
          onChange={(v) => setApiKey(String(v))}
          required
          {...(helpLinkAction(selectedProvider) ? { labelAction: helpLinkAction(selectedProvider) } : {})}
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
