import type {
  CreateEmbeddingProviderRequest,
  EmbeddingProvider,
  EmbeddingProviderName,
  EmbeddingProviderOption,
  UpdateEmbeddingProviderRequest,
} from './core'

/** Estado de la última prueba de conexión del proveedor de embeddings. */
export type EmbeddingTestState = 'idle' | 'testing' | 'ok' | 'error'

/**
 * Resultado del sheet: `create` (POST) cuando no hay proveedor o se cambia a otro,
 * `update` (PUT) cuando se editan las credenciales del proveedor activo.
 */
export type EmbeddingSheetSubmit =
  | { mode: 'create'; payload: CreateEmbeddingProviderRequest }
  | { mode: 'update'; payload: UpdateEmbeddingProviderRequest }

export interface EmbeddingProviderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  configured: EmbeddingProvider | null
  options: EmbeddingProviderOption[]
  /** Proveedor preseleccionado al abrir el sheet. */
  initialName: EmbeddingProviderName
  isSaving: boolean
  testState: EmbeddingTestState
  onTest: () => void
  onSubmit: (submit: EmbeddingSheetSubmit) => void
  canTest: boolean
  canSave: boolean
}

export interface EmbeddingsTabProps {
  configured: EmbeddingProvider | null
  options: EmbeddingProviderOption[]
  testState: EmbeddingTestState
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  onTest: () => void
  onEditCredentials: () => void
  onChooseProvider: (name: EmbeddingProviderName) => void
  onDisconnect: () => Promise<void>
}
