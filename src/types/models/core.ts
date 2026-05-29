export interface LLM {
  id: string;
  name: string;
  internal_name: string;
  provider_id: string;
  is_default?: boolean;
  capabilities?: string[];
}

export interface CreateLLMRequest {
  name: string;
  internal_name: string;
  provider_id: string;
  capabilities: string[];
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
