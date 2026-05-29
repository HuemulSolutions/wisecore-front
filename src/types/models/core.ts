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
