import { useState, useEffect } from "react"
import { Edit } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import type { SupportedProvider, CreateLLMProviderRequest } from "@/types/llm-provider"

interface EditProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  supportedProviders: SupportedProvider[]
  onSubmit: (data: CreateLLMProviderRequest) => void
  isUpdating: boolean
}

export function EditProviderDialog({
  open,
  onOpenChange,
  provider,
  supportedProviders,
  onSubmit,
  isUpdating,
}: EditProviderDialogProps) {
  const [name, setName] = useState("")
  const [isManaged, setIsManaged] = useState(false)
  const [selectedType, setSelectedType] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [deployment, setDeployment] = useState("")

  const selectedProvider = supportedProviders.find((p) => p.type === selectedType)

  // Populate form when provider changes
  useEffect(() => {
    if (provider && open) {
      setName(provider.name || "")
      setIsManaged(provider.is_managed || false)
      setSelectedType(provider.type || "")
      setApiKey("")
      setEndpoint("")
      setDeployment("")
    }
  }, [provider, open])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setName("")
      setIsManaged(false)
      setSelectedType("")
      setApiKey("")
      setEndpoint("")
      setDeployment("")
    }
  }, [open])

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

  if (!provider) return null

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Edit Provider - ${provider.display_name || provider.name}`}
      description={`Update the configuration settings for your ${provider.display_name || provider.name} provider.`}
      icon={Edit}
      saveAction={{
        label: isUpdating ? "Updating..." : "Update Provider",
        onClick: handleSave,
        disabled: !isFormValid || isUpdating,
        loading: isUpdating,
        closeOnSuccess: false,
      }}
    >
      <HuemulFieldGroup gap="gap-4">
        <HuemulField
          label="Name"
          name="providerName"
          placeholder="e.g. Azure Production, OpenAI Dev"
          value={name}
          onChange={(v) => setName(String(v))}
          required
        />

        <HuemulField
          type="switch"
          label="Managed Provider"
          name="isManaged"
          value={isManaged}
          onChange={(v) => setIsManaged(Boolean(v))}
          description="Managed providers are controlled by platform administrators and cannot be edited by organization users."
        />

        <HuemulField
          type="select"
          label="Provider Type"
          name="providerType"
          placeholder="Select a provider type..."
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
            label="API Key"
            name="apiKey"
            type="password"
            placeholder="Enter your API key..."
            value={apiKey}
            onChange={(v) => setApiKey(String(v))}
            required
          />
        )}

        {selectedProvider?.requires_endpoint && (
          <HuemulField
            label="Endpoint"
            name="endpoint"
            type="password"
            placeholder="https://api.example.com/v1"
            value={endpoint}
            onChange={(v) => setEndpoint(String(v))}
            required
          />
        )}

        {selectedProvider?.requires_deployment && (
          <HuemulField
            label="Deployment"
            name="deployment"
            type="password"
            placeholder="Enter deployment name..."
            value={deployment}
            onChange={(v) => setDeployment(String(v))}
            required
          />
        )}
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}
