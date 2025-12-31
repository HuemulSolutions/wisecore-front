import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

// Types
export interface LLMProvider {
  id: string;
  name: string;
  display_name: string;
  key?: string;
  endpoint?: string;
  deployment?: string;
}

export interface SupportedProvider {
  display: string;
  api_key: boolean;
  endpoint: boolean;
  deployment: boolean;
}

export interface SupportedProvidersResponse {
  data: Record<string, SupportedProvider>;
  transaction_id: string;
  timestamp: string;
}

export interface ConfiguredProvidersResponse {
  data: LLMProvider[];
  transaction_id: string;
  timestamp: string;
}

export interface CreateLLMProviderRequest {
  name: string;
  key: string;
  endpoint: string;
  deployment: string;
}

export interface LLM {
  id: string;
  name: string;
  internal_name: string;
  provider_id: string;
  is_default?: boolean;
}

export interface CreateLLMRequest {
  name: string;
  internal_name: string;
  provider_id: string;
}

// LLM Provider Services
export async function getSupportedProviders(): Promise<SupportedProvidersResponse> {
    const response = await httpClient.get(`${backendUrl}/llm_provider/supported`);
    if (!response.ok) {
        throw new Error('Error al obtener los proveedores soportados');
    }
    return response.json();
}

export async function getAllProviders(): Promise<ConfiguredProvidersResponse> {
    const response = await httpClient.get(`${backendUrl}/llm_provider/`);
    if (!response.ok) {
        throw new Error('Error al obtener los proveedores');
    }
    return response.json();
}

export async function createProvider(provider: CreateLLMProviderRequest): Promise<LLMProvider> {
    const response = await httpClient.post(`${backendUrl}/llm_provider/`, provider);

    if (!response.ok) {
        throw new Error('Error al crear el proveedor');
    }
    const data = await response.json();
    return data.data || data;
}

export async function getProvider(providerId: string): Promise<LLMProvider> {
    const response = await httpClient.get(`${backendUrl}/llm_provider/${providerId}`);
    if (!response.ok) {
        throw new Error('Error al obtener el proveedor');
    }
    const data = await response.json();
    return data.data || data;
}

export async function updateProvider(providerId: string, provider: Partial<CreateLLMProviderRequest>): Promise<LLMProvider> {
    const response = await httpClient.put(`${backendUrl}/llm_provider/${providerId}`, provider);

    if (!response.ok) {
        throw new Error('Error al actualizar el proveedor');
    }
    const data = await response.json();
    return data.data || data;
}

export async function deleteProvider(providerId: string): Promise<void> {
    const response = await httpClient.delete(`${backendUrl}/llm_provider/${providerId}`);

    if (!response.ok) {
        throw new Error('Error al eliminar el proveedor');
    }
}

// LLM Services
export async function getLLMs(): Promise<LLM[]> {
    const response = await httpClient.get(`${backendUrl}/llms/`);
    if (!response.ok) {
        throw new Error('Error al obtener los LLMs');
    }
    const data = await response.json();
    console.log('LLMs fetched:', data.data);
    return data.data || data;
}

export async function createLLM(llm: CreateLLMRequest): Promise<LLM> {
    const response = await httpClient.post(`${backendUrl}/llms/`, llm);

    if (!response.ok) {
        throw new Error('Error al crear el LLM');
    }
    const data = await response.json();
    return data.data || data;
}

export async function updateLLMModel(llmId: string, llm: Partial<CreateLLMRequest>): Promise<LLM> {
    const response = await httpClient.put(`${backendUrl}/llms/${llmId}`, llm);

    if (!response.ok) {
        throw new Error('Error al actualizar el LLM');
    }
    const data = await response.json();
    return data.data || data;
}

export async function deleteLLM(llmId: string): Promise<void> {
    const response = await httpClient.delete(`${backendUrl}/llms/${llmId}`);

    if (!response.ok) {
        throw new Error('Error al eliminar el LLM');
    }
}

export async function setDefaultLLM(llmId: string): Promise<void> {
    const response = await httpClient.patch(`${backendUrl}/llms/${llmId}/set_default`, {});

    if (!response.ok) {
        throw new Error('Error al establecer el LLM por defecto');
    }
}

export async function getDefaultLLM(): Promise<LLM> {
    const response = await httpClient.get(`${backendUrl}/llms/default`);
    if (!response.ok) {
        throw new Error('Error al obtener el LLM por defecto');
    }
    const data = await response.json();
    return data.data || data;
}

// Legacy function for backward compatibility
export async function updateExecutionLLM(executionId: string, llmId: string) {
    const response = await httpClient.put(`${backendUrl}/execution/update_llm/${executionId}`, { llm_id: llmId });

    if (!response.ok) {
        throw new Error('Error al actualizar el LLM');
    }
    return response.json();
}