import type { LLM } from './core'
import type { LLMProvider } from '../llm-provider'

export interface ModelDialogSubmitData {
  name: string
  internal_name: string
  capabilities: string[]
  provider_id?: string
  /** USD por 1.000.000 de tokens de entrada. null cuando no se define tarifa. */
  input_price_per_1m_tokens?: number | null
  output_price_per_1m_tokens?: number | null
}

export interface ModelSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Modelo a editar; `null` para agregar uno nuevo. */
  model: LLM | null
  providers: LLMProvider[]
  /** true si todavía no hay ningún modelo: el nuevo quedará como predeterminado. */
  isFirstModel: boolean
  isSaving: boolean
  onSubmit: (data: ModelDialogSubmitData) => void
  onConnectProvider: () => void
  canSave: boolean
}
