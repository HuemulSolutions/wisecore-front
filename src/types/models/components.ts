import type { LLM } from './core'
import type { LLMProvider } from '../llm-provider'

export interface ModelsContentEmptyStateProps {
  type: 'empty' | 'error'
  message?: string
  onRetry?: () => void
}

export interface ModelsHeaderProps {
  isLoading: boolean
  onRefresh: () => void
}

/** Estado de la última prueba de conexión de un modelo. */
export type ModelTestState = 'testing' | 'ok' | 'error'

export interface ModelsStatusCardsProps {
  isLoading: boolean
  defaultModel: LLM | null
  defaultProviderName?: string
  defaultConfigured: boolean
  /** false si el backend marcó el modelo como no operativo o la última prueba falló. */
  defaultWorking: boolean
  defaultTestState?: ModelTestState
  hasProviders: boolean
  embeddingConfigured: boolean
  embeddingWorking: boolean
  embeddingProviderName?: string
  canTest: boolean
  canCreateProvider: boolean
  canCreateModel: boolean
  canViewEmbeddings: boolean
  onTestDefault: () => void
  onConnectProvider: () => void
  onAddModel: () => void
  onGoToEmbeddings: () => void
}

export interface ModelsProvidersStripProps {
  providers: LLMProvider[]
  /** Cantidad de modelos por `provider_id`. */
  modelCounts: Record<string, number>
  canCreate: boolean
  canEdit: boolean
  onEdit: (provider: LLMProvider) => void
  onCreate: () => void
}

export interface ModelsTableProps {
  models: LLM[]
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  hasProviders: boolean
  search: string
  onSearchChange: (value: string) => void
  testStates: Record<string, ModelTestState>
  isDeleting: boolean
  onTest: (model: LLM) => void
  onEdit: (model: LLM) => void
  onSetDefault: (model: LLM) => void
  onDelete: (model: LLM) => Promise<void>
  onReviewProvider: (model: LLM) => void
  onAddModel: () => void
  onConnectProvider: () => void
  onRetry: () => void
  canCreateModel: boolean
  canUpdateModel: boolean
  canDeleteModel: boolean
  canTestModel: boolean
  canCreateProvider: boolean
  canUpdateProvider: boolean
  pagination: {
    page: number
    pageSize: number
    hasNext?: boolean
    onPageChange: (page: number) => void
    onPageSizeChange: (pageSize: number) => void
  }
}
