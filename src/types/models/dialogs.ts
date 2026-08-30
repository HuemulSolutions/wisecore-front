import type { LLM } from './core'

export interface ModelCapabilitiesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: LLM | null
  isUpdating: boolean
  onSubmit: (model: LLM, capabilities: string[]) => void
  canUpdate: boolean
}

export interface DeleteModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: LLM | null
  onAction: () => Promise<void>
  canDelete: boolean
}

export interface ModelDialogSubmitData {
  name: string
  internal_name: string
  capabilities: string[]
  provider_id?: string
  /** USD por 1.000.000 de tokens de entrada. null cuando no se define tarifa. */
  input_price_per_1m_tokens?: number | null
  output_price_per_1m_tokens?: number | null
}

export interface ModelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model?: LLM | null
  providerName?: string
  providers?: { id: string; name: string; type?: string }[]
  isCreating: boolean
  isUpdating: boolean
  onSubmit: (data: ModelDialogSubmitData) => void
  canSave: boolean
}
