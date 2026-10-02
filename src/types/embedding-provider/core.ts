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
  /** Nombre visible. Cambiar solo esto no vuelve a llamar al proveedor. */
  label?: string;
}

/** Alta de un proveedor en un espacio libre (POST /embedding_provider/providers). */
export type CreateAdditionalEmbeddingProviderRequest = CreateEmbeddingProviderRequest & { label?: string };

/**
 * Un "espacio" de la pestaña Embeddings: proveedor de GET /embedding_provider/providers, con la
 * cobertura de sus vectores. La organización tiene hasta `max_providers` (3): el predeterminado,
 * que usa toda búsqueda, y los de evaluación.
 */
export interface EmbeddingProviderSlot {
  id: string;
  name: EmbeddingProviderName;
  display_name: string;
  label?: string | null;
  model_name?: string | null;
  dimensions?: number | null;
  is_default: boolean;
  index_status: EmbeddingIndexStatus;
  created_at?: string;
  /** Fragmentos indexados de la organización (el mismo número para todos los proveedores). */
  chunks_total?: number | null;
  /** Fragmentos que ya tienen vector de este proveedor. */
  chunks_with_vectors?: number | null;
  /** 0..1; null si todavía no hay fragmentos indexados. */
  coverage_ratio?: number | null;
  max_providers?: number;
}
