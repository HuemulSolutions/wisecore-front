import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings, Edit } from "lucide-react"

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isConfiguring ? (
              <>
                <Settings className="h-5 w-5 text-[#4464f7]" />
                Configure Provider - {provider.display_name || provider.name}
              </>
            ) : (
              <>
                <Edit className="h-5 w-5 text-[#4464f7]" />
                Edit Provider - {provider.display_name || provider.name}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isConfiguring 
              ? `Set up your ${provider.display_name || provider.name} provider configuration with your API credentials.`
              : `Update the configuration settings for your ${provider.display_name || provider.name} provider.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <div className="space-y-4">
              {/* Show API Key field only if required by provider */}
              {requiredFields.api_key && (
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    API Key *
                  </label>
                  <Input
                    id="edit-key"
                    name="key"
                    type="password"
                    defaultValue={provider.key}
                    placeholder="Enter your API key..."
                    className="w-full"
                    required
                  />
                </div>
              )}
              {/* Show Endpoint field only if required by provider */}
              {requiredFields.endpoint && (
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Endpoint *
                  </label>
                  <Input
                    id="edit-endpoint"
                    name="endpoint"
                    type="password"
                    defaultValue={provider.endpointValue || provider.endpoint}
                    placeholder="https://api.example.com/v1"
                    className="w-full"
                    required
                  />
                </div>
              )}
              {/* Show Deployment field only if required by provider */}
              {requiredFields.deployment && (
                <div>
                  <label className="text-sm font-medium text-gray-900 block mb-2">
                    Deployment *
                  </label>
                  <Input
                    id="edit-deployment"
                    name="deployment"
                    type="password"
                    defaultValue={provider.deploymentValue || provider.deployment}
                    placeholder="Enter deployment name..."
                    className="w-full"
                    required
                  />
                </div>
              )}
              {/* Hidden fields for non-required fields to ensure form data consistency */}
              {!requiredFields.api_key && (
                <input type="hidden" name="key" value="" />
              )}
              {!requiredFields.endpoint && (
                <input type="hidden" name="endpoint" value="" />
              )}
              {!requiredFields.deployment && (
                <input type="hidden" name="deployment" value="" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isUpdating || isCreating}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdating || isCreating}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {(isUpdating || isCreating) 
                ? 'Saving...' 
                : isConfiguring
                  ? 'Configure Provider'
                  : 'Update Configuration'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}