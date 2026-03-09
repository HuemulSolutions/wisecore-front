import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  EmbeddingProvider,
  SupportedEmbeddingProvider,
  ResponseSchema,
  CreateEmbeddingProviderRequest,
  UpdateEmbeddingProviderRequest,
} from "@/types/embedding-provider";

// Re-export types for backward compatibility
export type {
  EmbeddingProviderName,
  EmbeddingProvider,
  SupportedEmbeddingProvider,
  ResponseSchema,
  CreateEmbeddingProviderRequest,
  UpdateEmbeddingProviderRequest,
} from "@/types/embedding-provider";

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
