import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Plus, Edit } from "lucide-react"
import type { LLM } from "@/services/llms"
import DualNameFields from "@/components/models/models-fields"
import { useState, useEffect } from "react"

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
  const [displayName, setDisplayName] = useState(model?.name || '')
  const [technicalName, setTechnicalName] = useState(model?.internal_name || '')

  useEffect(() => {
    setDisplayName(model?.name || '')
    setTechnicalName(model?.internal_name || '')
  }, [model])

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit Model - ${model?.name}` : `Add Model to ${providerName}`}
      description={isEdit ? "Update the configuration for your AI model." : `Add a new AI model to your ${providerName} provider configuration.`}
      icon={isEdit ? Edit : Plus}
      formId="model-form"
      submitLabel={isEdit ? "Update Model" : "Save Model"}
      isSubmitting={isCreating || isUpdating}
      showDefaultFooter
    >
      <form id="model-form" onSubmit={onSubmit}>
        <input type="hidden" name="displayName" value={displayName} />
        <input type="hidden" name="technicalName" value={technicalName} />
        <DualNameFields
          displayName={displayName}
          technicalName={technicalName}
          onDisplayNameChange={setDisplayName}
          onTechnicalNameChange={setTechnicalName}
          displayNamePlaceholder="e.g. GPT-4 Turbo"
          technicalNamePlaceholder="e.g., gpt-4-turbo-preview"
          technicalNameDescription="Use the exact model name as specified by the provider's API documentation."
          disabled={isCreating || isUpdating}
        />
      </form>
    </ReusableDialog>
  )
}