import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  LLMProvider,
  SupportedProvidersResponse,
  ConfiguredProvidersResponse,
  CreateLLMProviderRequest,
} from "@/types/llm-provider";

export async function getSupportedProviders(): Promise<SupportedProvidersResponse> {
    const response = await httpClient.get(`${backendUrl}/llm_provider/supported`);
    return response.json();
}

export async function getAllProviders(): Promise<ConfiguredProvidersResponse> {
    const response = await httpClient.get(`${backendUrl}/llm_provider/`);
    return response.json();
}

export async function createProvider(provider: CreateLLMProviderRequest): Promise<LLMProvider> {
    const response = await httpClient.post(`${backendUrl}/llm_provider/`, provider);
    const data = await response.json();
    return data.data || data;
}

export async function getProvider(providerId: string): Promise<LLMProvider> {
    const response = await httpClient.get(`${backendUrl}/llm_provider/${providerId}`);
    const data = await response.json();
    return data.data || data;
}

export async function updateProvider(providerId: string, provider: CreateLLMProviderRequest): Promise<LLMProvider> {
    const response = await httpClient.put(`${backendUrl}/llm_provider/${providerId}`, provider);
    const data = await response.json();
    return data.data || data;
}

export async function deleteProvider(providerId: string): Promise<void> {
    await httpClient.delete(`${backendUrl}/llm_provider/${providerId}`);
}
