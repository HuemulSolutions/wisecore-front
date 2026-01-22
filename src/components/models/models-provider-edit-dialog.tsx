import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Settings, Edit } from "lucide-react"
import ProviderFormFields from "@/components/models/models-provider-form-fields"

interface EditProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  isUpdating: boolean
  isCreating: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function EditProviderDialog({
  open,
  onOpenChange,
  provider,
  isUpdating,
  isCreating,
  onSubmit
}: EditProviderDialogProps) {
  if (!provider) return null

  const getRequiredFields = (provider: any) => {
    return {
      api_key: provider.api_key === true,
      endpoint: provider.endpoint === true,
      deployment: provider.deployment === true
    }
  }

  const requiredFields = getRequiredFields(provider)
  const isConfiguring = provider.isConfigured === false || provider.id?.startsWith('unconfigured-')

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isConfiguring ? `Configure Provider - ${provider.display_name || provider.name}` : `Edit Provider - ${provider.display_name || provider.name}`}
      description={isConfiguring ? `Set up your ${provider.display_name || provider.name} provider configuration with your API credentials.` : `Update the configuration settings for your ${provider.display_name || provider.name} provider.`}
      icon={isConfiguring ? Settings : Edit}
      formId="edit-provider-form"
      submitLabel={isConfiguring ? 'Configure Provider' : 'Update Configuration'}
      isSubmitting={isUpdating || isCreating}
      showDefaultFooter
      maxHeight="90vh"
    >
      <form id="edit-provider-form" onSubmit={onSubmit}>
        <ProviderFormFields
          requiredFields={requiredFields}
          defaultValues={{
            key: provider.key,
            endpoint: provider.endpointValue || provider.endpoint,
            deployment: provider.deploymentValue || provider.deployment
          }}
          disabled={isUpdating || isCreating}
        />
      </form>
    </ReusableDialog>
  )
}