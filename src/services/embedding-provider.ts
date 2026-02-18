import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

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

export async function getSupportedEmbeddingProviders(page = 1, pageSize = 1000): Promise<ResponseSchema<SupportedEmbeddingProvider[]>> {
  const response = await httpClient.get(`${backendUrl}/embedding_provider/supported?page=${page}&page_size=${pageSize}`);
  return response.json();
}

export async function getEmbeddingProvider(): Promise<ResponseSchema<EmbeddingProvider | null>> {
  const response = await httpClient.get(`${backendUrl}/embedding_provider/`);
  return response.json();
}

export async function createEmbeddingProvider(payload: CreateEmbeddingProviderRequest): Promise<EmbeddingProvider> {
  const response = await httpClient.post(`${backendUrl}/embedding_provider/`, payload);
  const data = await response.json();
  return data.data || data;
}

export async function updateEmbeddingProvider(payload: UpdateEmbeddingProviderRequest): Promise<EmbeddingProvider> {
  const response = await httpClient.put(`${backendUrl}/embedding_provider/`, payload);
  const data = await response.json();
  return data.data || data;
}

export async function deleteEmbeddingProvider(): Promise<void> {
  await httpClient.delete(`${backendUrl}/embedding_provider/`);
}
