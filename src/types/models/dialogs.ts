import type { LLM } from './core'

export interface ModelCapabilitiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: LLM | null
  isUpdating: boolean
  onSubmit: (model: LLM, capabilities: string[]) => void
}

export interface DeleteModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: LLM | null
  onAction: () => Promise<void>
}

export interface ModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: LLM | null
  providerName?: string
  providers?: { id: string; name: string; type?: string }[]
  isCreating: boolean
  isUpdating: boolean
  onSubmit: (data: { name: string; internal_name: string; capabilities: string[]; provider_id?: string }) => void
}
