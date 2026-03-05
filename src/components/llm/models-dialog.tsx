import { useState, useEffect } from "react"
import { Plus, Edit } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField, HuemulFieldGroup } from "@/huemul/components/huemul-field"
import type { LLM } from "@/types/llm"

interface ModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: LLM | null
  providerName?: string
  isCreating: boolean
  isUpdating: boolean
  onSubmit: (data: { name: string; internal_name: string; capabilities: string[] }) => void
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
  const [displayName, setDisplayName] = useState('')
  const [technicalName, setTechnicalName] = useState('')

  useEffect(() => {
    if (model && open) {
      setDisplayName(model.name || '')
      setTechnicalName(model.internal_name || '')
    }
  }, [model, open])

  useEffect(() => {
    if (!open) {
      setDisplayName('')
      setTechnicalName('')
    }
  }, [open])

  const isSubmitting = isCreating || isUpdating

  const handleSave = () => {
    onSubmit({ name: displayName, internal_name: technicalName, capabilities: ['text_generation'] })
  }

  const isFormValid = displayName.trim() !== '' && technicalName.trim() !== ''

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit Model - ${model?.name}` : `Add Model to ${providerName}`}
      description={isEdit ? "Update the configuration for your AI model." : `Add a new AI model to your ${providerName} provider configuration.`}
      icon={isEdit ? Edit : Plus}
      saveAction={{
        label: isSubmitting
          ? (isEdit ? "Updating..." : "Saving...")
          : (isEdit ? "Update Model" : "Save Model"),
        onClick: handleSave,
        disabled: !isFormValid || isSubmitting,
        loading: isSubmitting,
        closeOnSuccess: false,
      }}
    >
      <HuemulFieldGroup gap="gap-4">
        <HuemulField
          label="Display Name"
          name="displayName"
          placeholder="e.g. GPT-4 Turbo"
          value={displayName}
          onChange={(v) => setDisplayName(String(v))}
          disabled={isSubmitting}
          required
        />
        <HuemulField
          label="Technical Name"
          name="technicalName"
          placeholder="e.g., gpt-4-turbo-preview"
          value={technicalName}
          onChange={(v) => setTechnicalName(String(v))}
          description="Use the exact model name as specified by the provider's API documentation."
          disabled={isSubmitting}
          required
        />
      </HuemulFieldGroup>
    </HuemulDialog>
  )
}