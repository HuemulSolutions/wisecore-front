import type {
  CreateAdditionalEmbeddingProviderRequest,
  CreateEmbeddingProviderRequest,
  EmbeddingProviderName,
  EmbeddingProviderOption,
  EmbeddingProviderSlot,
  UpdateEmbeddingProviderRequest,
} from './core'

/** Estado de la última prueba de conexión del proveedor de embeddings. */
export type EmbeddingTestState = 'idle' | 'testing' | 'ok' | 'error'

/**
 * Para qué se abre el sheet:
 * - `create`: primer proveedor de la organización (queda como predeterminado).
 * - `add`: proveedor de evaluación en un espacio libre.
 * - `edit`: editar un proveedor existente (`editing`).
 */
export type EmbeddingSheetMode = 'create' | 'add' | 'edit'

export type EmbeddingSheetSubmit =
  | { mode: 'create'; payload: CreateEmbeddingProviderRequest }
  | { mode: 'add'; payload: CreateAdditionalEmbeddingProviderRequest }
  | { mode: 'edit'; providerId: string; payload: UpdateEmbeddingProviderRequest }

export interface EmbeddingProviderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: EmbeddingSheetMode
  /** Proveedor que se edita (solo en `edit`). */
  editing: EmbeddingProviderSlot | null
  options: EmbeddingProviderOption[]
  /** Proveedor preseleccionado al abrir el sheet. */
  initialName: EmbeddingProviderName
  isSaving: boolean
  testState: EmbeddingTestState
  /** Prueba la configuración guardada del proveedor que se edita. */
  onTest: () => void
  onSubmit: (submit: EmbeddingSheetSubmit) => void
  canTest: boolean
  canSave: boolean
}

export interface EmbeddingsTabProps {
  /** Proveedores de la organización, el predeterminado primero. */
  providers: EmbeddingProviderSlot[]
  /** Tope de proveedores por organización (espacios). */
  maxProviders: number
  /** Proveedores soportados (para el primer alta). */
  options: EmbeddingProviderOption[]
  /** Última prueba de conexión por id de proveedor. */
  testStates: Record<string, EmbeddingTestState>
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  /** Sin proveedores: configurar el primero. */
  onConfigureFirst: (name: EmbeddingProviderName) => void
  /** Agregar un proveedor de evaluación en un espacio libre. */
  onAddProvider: () => void
  onEditProvider: (provider: EmbeddingProviderSlot) => void
  onTestProvider: (provider: EmbeddingProviderSlot) => void
  /** `force` promueve aunque falten vectores (la búsqueda devuelve menos resultados mientras tanto). */
  onMakeDefault: (provider: EmbeddingProviderSlot, force: boolean) => Promise<void>
  onBuildIndex: (provider: EmbeddingProviderSlot) => void
  /** Borra el proveedor (el predeterminado solo cuando es el único: desconectar). */
  onDeleteProvider: (provider: EmbeddingProviderSlot) => Promise<void>
}
