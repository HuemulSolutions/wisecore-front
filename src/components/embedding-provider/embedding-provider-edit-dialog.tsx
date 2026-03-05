import { useState, useEffect } from "react"
import { Settings, Edit } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"

interface EmbeddingProviderEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  onSubmit: (data: { name: string; key?: string; endpoint?: string; deployment?: string }) => void
  isSubmitting: boolean
}

export function EmbeddingProviderEditDialog({
  open,
  onOpenChange,
  provider,
  onSubmit,
  isSubmitting,
}: EmbeddingProviderEditDialogProps) {
  const [apiKey, setApiKey] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [deployment, setDeployment] = useState("")

  // Populate form when provider changes
  useEffect(() => {
    if (provider && open) {
      setApiKey(provider.key || "")
      setEndpoint(provider.endpointValue || "")
      setDeployment(provider.deploymentValue || "")
    }
  }, [provider, open])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setApiKey("")
      setEndpoint("")
      setDeployment("")
    }
  }, [open])

  if (!provider) return null

  const isConfiguring = !provider.isConfigured
  const providerKey = provider.providerKey || provider.name

  const requiresApiKey = provider.api_key === true
  const requiresEndpoint = provider.endpoint === true
  const requiresDeployment = provider.deployment === true

  const handleSave = async () => {
    const data: { name: string; key?: string; endpoint?: string; deployment?: string } = {
      name: providerKey,
    }

    if (requiresApiKey) data.key = apiKey
    if (requiresEndpoint) data.endpoint = endpoint
    if (requiresDeployment) data.deployment = deployment

    onSubmit(data)
  }

  const isFormValid =
    (!requiresApiKey || apiKey.trim() !== "") &&
    (!requiresEndpoint || endpoint.trim() !== "") &&
    (!requiresDeployment || deployment.trim() !== "")

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isConfiguring ? `Configure Provider - ${provider.display_name || provider.name}` : `Edit Provider - ${provider.display_name || provider.name}`}
      description={isConfiguring ? `Set up your ${provider.display_name || provider.name} provider with your API credentials.` : `Update the configuration for your ${provider.display_name || provider.name} provider.`}
      icon={isConfiguring ? Settings : Edit}
      saveAction={{
        label: isSubmitting
          ? (isConfiguring ? "Configuring..." : "Updating...")
          : (isConfiguring ? "Configure Provider" : "Update Provider"),
        onClick: handleSave,
        disabled: !isFormValid || isSubmitting,
        loading: isSubmitting,
        closeOnSuccess: false,
      }}
    >
      <HuemulFieldGroup gap="gap-4">
        {requiresApiKey && (
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

        {requiresEndpoint && (
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

        {requiresDeployment && (
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
