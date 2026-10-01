import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  EmbeddingProvider,
  EmbeddingProviderSlot,
  SupportedEmbeddingProvider,
  ResponseSchema,
  CreateAdditionalEmbeddingProviderRequest,
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

export async function testEmbeddingProviderConnection(): Promise<{ ok: boolean }> {
  const response = await httpClient.post(`${backendUrl}/embedding_provider/test_connection`, {});
  const data = await response.json();
  const result = data.data || data;
  if (!result?.ok) throw new Error();
  return result;
}

// ---------------------------------------------------------------------------
// Varios proveedores (hasta 3 por organización): el predeterminado y los de evaluación.
// ---------------------------------------------------------------------------

/** Proveedores de la organización, el predeterminado primero, con la cobertura de sus vectores. */
export async function listEmbeddingProviders(): Promise<EmbeddingProviderSlot[]> {
  const response = await httpClient.get(`${backendUrl}/embedding_provider/providers`);
  const data = await response.json();
  return data.data ?? [];
}

/** Agrega un proveedor en un espacio libre. Calcula sus vectores en segundo plano. */
export async function createAdditionalEmbeddingProvider(
  payload: CreateAdditionalEmbeddingProviderRequest,
): Promise<EmbeddingProviderSlot> {
  const response = await httpClient.post(`${backendUrl}/embedding_provider/providers`, payload);
  const data = await response.json();
  return data.data || data;
}

export async function updateEmbeddingProviderById(
  providerId: string,
  payload: UpdateEmbeddingProviderRequest,
): Promise<EmbeddingProviderSlot & { model_changed?: boolean | null }> {
  const response = await httpClient.put(`${backendUrl}/embedding_provider/providers/${providerId}`, payload);
  const data = await response.json();
  return data.data || data;
}

/** Lo hace predeterminado. Sin `force`, el backend exige vectores para todo el contenido. */
export async function setDefaultEmbeddingProvider(providerId: string, force = false): Promise<EmbeddingProviderSlot> {
  const query = force ? "?force=true" : "";
  const response = await httpClient.patch(`${backendUrl}/embedding_provider/providers/${providerId}/default${query}`, {});
  const data = await response.json();
  return data.data || data;
}

/** Vuelve a construir el índice del proveedor y completa sus vectores. */
export async function buildEmbeddingProviderIndex(providerId: string): Promise<void> {
  await httpClient.post(`${backendUrl}/embedding_provider/providers/${providerId}/build_index`, {});
}

export async function deleteEmbeddingProviderById(providerId: string): Promise<void> {
  await httpClient.delete(`${backendUrl}/embedding_provider/providers/${providerId}`);
}

export async function testEmbeddingProviderById(providerId: string): Promise<{ ok: boolean }> {
  const response = await httpClient.post(`${backendUrl}/embedding_provider/providers/${providerId}/test_connection`, {});
  const data = await response.json();
  const result = data.data || data;
  if (!result?.ok) throw new Error();
  return result;
}
