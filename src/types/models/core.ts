export interface LLM {
  id: string;
  name: string;
  internal_name: string;
  provider_id: string;
  provider_name?: string;
  provider?: {
    id: string;
    name: string;
    type: string;
    is_managed: boolean;
    key?: string;
    endpoint?: string;
    deployment?: string;
    created_at?: string;
    updated_at?: string;
  };
  is_default?: boolean;
  /** LLM que la organización marcó para la búsqueda de mayor precisión (rerank). Uno por org, sin fallback. */
  is_rerank_default?: boolean;
  /** LLM que la organización marcó para analizar imágenes. Uno por org, sin fallback. */
  is_image_analysis_default?: boolean;
  capabilities?: string[];
  /** USD por 1.000.000 de tokens de entrada. null si no tiene tarifa configurada. */
  input_price_per_1m_tokens?: number | null;
  output_price_per_1m_tokens?: number | null;
}

export interface CreateLLMRequest {
  name: string;
  internal_name: string;
  provider_id: string;
  capabilities: string[];
  input_price_per_1m_tokens?: number | null;
  output_price_per_1m_tokens?: number | null;
}

export interface LLMsResponse {
  data: LLM[];
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface LlmConfigurationStatusItem {
  is_configured: boolean;
  is_working: boolean;
}

/** Estado de un propósito opcional: solo si hay un LLM marcado (sin probe de red). */
export interface LlmPurposeStatusItem {
  is_configured: boolean;
}

export interface LlmConfigurationStatusData {
  embedding: LlmConfigurationStatusItem;
  default_llm: LlmConfigurationStatusItem;
  rerank?: LlmPurposeStatusItem;
  image_analysis?: LlmPurposeStatusItem;
}

/** Propósitos con LLM propio (PATCH /llms/{id}/set_default_for/{purpose}). */
export type LlmPurpose = 'rerank' | 'image_analysis';

/** Respuesta de marcar un LLM para un propósito. */
export type SetLlmPurposeResponse = LLM & {
  /** true si marcar el LLM de imágenes encoló el análisis de las imágenes pendientes. */
  media_scan_enqueued?: boolean;
};

export interface LlmConfigurationStatusResponse {
  data: LlmConfigurationStatusData;
  transaction_id: string;
  page: null;
  page_size: null;
  has_next: null;
  timestamp: string;
}
