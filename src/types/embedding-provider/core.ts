export type EmbeddingProviderName = 'openai' | 'azure_openai';

/** Estado del índice vectorial del proveedor (PR backend #356). */
export type EmbeddingIndexStatus = 'none' | 'building' | 'ready' | 'failed';

export interface EmbeddingProvider {
  name: EmbeddingProviderName;
  key?: string;
  endpoint?: string;
  deployment?: string;
  id?: string;
  label?: string | null;
  model_name?: string | null;
  dimensions?: number | null;
  is_default?: boolean;
  index_status?: EmbeddingIndexStatus;
  /** Solo en la respuesta de actualizar: cambió el modelo y la búsqueda se reindexa. */
  model_changed?: boolean | null;
}

export interface SupportedEmbeddingProvider {
  name: EmbeddingProviderName;
  display: string;
  is_configured: boolean;
}

/** Proveedor soportado combinado con el estado de configuración de la organización. */
export interface EmbeddingProviderOption {
  name: EmbeddingProviderName;
  display: string;
  /** true si es el proveedor que la organización tiene configurado hoy. */
  isActive: boolean;
  requiresEndpoint: boolean;
  requiresDeployment: boolean;
}

export interface ResponseSchema<T> {
  transaction_id: string;
  data: T;
  timestamp: string;
  page?: number;
  page_size?: number;
  has_next?: boolean;
}

export type CreateEmbeddingProviderRequest =
  | { name: 'openai'; key: string }
  | { name: 'azure_openai'; key: string; endpoint: string; deployment: string };

export interface UpdateEmbeddingProviderRequest {
  name?: EmbeddingProviderName;
  key?: string;
  endpoint?: string;
  deployment?: string;
}
