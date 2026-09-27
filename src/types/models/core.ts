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

export interface LlmConfigurationStatusData {
  embedding: LlmConfigurationStatusItem;
  default_llm: LlmConfigurationStatusItem;
}

export interface LlmConfigurationStatusResponse {
  data: LlmConfigurationStatusData;
  transaction_id: string;
  page: null;
  page_size: null;
  has_next: null;
  timestamp: string;
}
