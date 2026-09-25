import type { SupportedProvider, CreateLLMProviderRequest, LLMProvider } from './core'

export interface ProviderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Proveedor a editar; `null` para conectar uno nuevo. */
  provider: LLMProvider | null
  supportedProviders: SupportedProvider[]
  /** Cantidad de modelos que usan el proveedor (bloquea su eliminación si > 0). */
  modelCount: number
  isSaving: boolean
  onSubmit: (data: CreateLLMProviderRequest) => void
  onDelete: () => Promise<void>
  canSave: boolean
  canDelete: boolean
}
