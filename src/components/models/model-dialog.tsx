import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Edit } from "lucide-react"
import type { LLM } from "@/services/llms"

interface ModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: LLM | null
  providerName?: string
  isCreating: boolean
  isUpdating: boolean
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function ModelDialog({
  open,
  onOpenChange,
  model,
  providerName,
  isCreating,
  isUpdating,
  onSubmit
}: ModelDialogProps) {
  const isEdit = !!model

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEdit ? (
                <>
                  <Edit className="h-5 w-5 text-[#4464f7]" />
                  Edit Model - {model?.name}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 text-[#4464f7]" />
                  Add Model to {providerName}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEdit 
                ? "Update the configuration for your AI model."
                : `Add a new AI model to your ${providerName} provider configuration.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">
                  Display Name *
                </label>
                <Input 
                  id={isEdit ? "edit-displayName" : "displayName"}
                  name="displayName" 
                  defaultValue={isEdit ? model?.name : ""}
                  placeholder="e.g. GPT-4 Turbo" 
                  className="w-full"
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900 block mb-2">
                  Technical Name *
                </label>
                <Input
                  id={isEdit ? "edit-technicalName" : "technicalName"}
                  name="technicalName"
                  defaultValue={isEdit ? model?.internal_name : ""}
                  placeholder="e.g., gpt-4-turbo-preview"
                  className="w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the exact model name as specified by the provider's API documentation.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating || isUpdating}
              className="hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || isUpdating}
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
            >
              {isEdit 
                ? (isUpdating ? 'Updating...' : 'Update Model')
                : (isCreating ? 'Creating...' : 'Save Model')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}