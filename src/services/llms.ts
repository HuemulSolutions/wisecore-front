import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type { LLM, CreateLLMRequest } from "@/types/llm";

// Re-export types for backward compatibility
export type { LLM, CreateLLMRequest } from "@/types/llm";
export type {
  LLMProvider,
  SupportedProvider,
  SupportedProvidersResponse,
  ConfiguredProvidersResponse,
  CreateLLMProviderRequest,
} from "@/types/llm-provider";

// Re-export provider services for backward compatibility
export {
  getSupportedProviders,
  getAllProviders,
  createProvider,
  getProvider,
  updateProvider,
  deleteProvider,
} from "@/services/llm-provider";

export async function getLLMs(): Promise<LLM[]> {
    const response = await httpClient.get(`${backendUrl}/llms/`);
    const data = await response.json();
    return data.data || data;
}

export async function createLLM(llm: CreateLLMRequest): Promise<LLM> {
    const response = await httpClient.post(`${backendUrl}/llms/`, llm);
    const data = await response.json();
    return data.data || data;
}

export async function updateLLMModel(llmId: string, llm: CreateLLMRequest): Promise<LLM> {
    const response = await httpClient.put(`${backendUrl}/llms/${llmId}`, llm);
    const data = await response.json();
    return data.data || data;
}

export async function deleteLLM(llmId: string): Promise<void> {
    await httpClient.delete(`${backendUrl}/llms/${llmId}`);
}

export async function setDefaultLLM(llmId: string): Promise<void> {
    await httpClient.patch(`${backendUrl}/llms/${llmId}/set_default`, {});
}

export async function getDefaultLLM(): Promise<LLM> {
    const response = await httpClient.get(`${backendUrl}/llms/default`);
    const data = await response.json();
    return data.data || data;
}

// Legacy function for backward compatibility
export async function updateExecutionLLM(executionId: string, llmId: string) {
    const response = await httpClient.put(`${backendUrl}/execution/update_llm/${executionId}`, { llm_id: llmId });
    return response.json();
}

// Test LLM connection
export async function testLLMConnection(llmId: string): Promise<{ ok: boolean }> {
    const response = await httpClient.post(`${backendUrl}/llms/${llmId}/test_connection`, {});
    const data = await response.json();
    return data.data || data;
}
