export interface LLMProvider {
  id: string;
  name: string;
  type: string;
  display_name: string;
  is_managed: boolean;
  key?: string;
  endpoint?: string;
  deployment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupportedProvider {
  type: string;
  display_name: string;
  requires_api_key: boolean;
  requires_endpoint: boolean;
  requires_deployment: boolean;
  docs_url?: string;
  credentials_url?: string;
}

export interface SupportedProvidersResponse {
  data: SupportedProvider[];
  transaction_id: string;
  page?: number;
  page_size?: number;
  has_next?: boolean;
  timestamp: string;
}

export interface ConfiguredProvidersResponse {
  data: LLMProvider[];
  transaction_id: string;
  page?: number;
  page_size?: number;
  has_next?: boolean;
  timestamp: string;
}

export interface CreateLLMProviderRequest {
  name: string;
  type: string;
  key?: string;
  endpoint?: string;
  deployment?: string;
  is_managed?: boolean;
}
