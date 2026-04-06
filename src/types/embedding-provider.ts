export type EmbeddingProviderName = 'openai' | 'azure_openai';

export interface EmbeddingProvider {
  name: EmbeddingProviderName;
  key?: string;
  endpoint?: string;
  deployment?: string;
}

export interface SupportedEmbeddingProvider {
  name: EmbeddingProviderName;
  display: string;
  is_configured: boolean;
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
