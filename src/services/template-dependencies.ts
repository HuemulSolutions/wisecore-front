import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import type {
  TemplateDependency,
  TemplateDependenciesResponse,
  CreateTemplateDependencyRequest,
  UpdateTemplateDependencyRequest,
} from "@/types/templates";

export async function getTemplateDependencies(
  templateId: string,
  organizationId: string,
  { page = 1, page_size = 100 }: { page?: number; page_size?: number } = {},
): Promise<TemplateDependenciesResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  });
  const response = await httpClient.get(`${backendUrl}/templates/${templateId}/dependencies?${params.toString()}`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  const data = await response.json();
  logger.log('Template dependencies fetched:', data.data);
  return data;
}

export async function createTemplateDependency(templateId: string, body: CreateTemplateDependencyRequest, organizationId: string): Promise<TemplateDependency> {
  const response = await httpClient.post(`${backendUrl}/templates/${templateId}/dependencies`, body, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  const data = await response.json();
  logger.log('Template dependency added:', data.data);
  return data.data;
}

export async function updateTemplateDependency(templateId: string, dependencyId: string, body: UpdateTemplateDependencyRequest, organizationId: string): Promise<TemplateDependency> {
  const response = await httpClient.patch(`${backendUrl}/templates/${templateId}/dependencies/${dependencyId}`, body, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  const data = await response.json();
  logger.log('Template dependency updated:', data.data);
  return data.data;
}

export async function deleteTemplateDependency(templateId: string, dependencyId: string, organizationId: string): Promise<void> {
  await httpClient.delete(`${backendUrl}/templates/${templateId}/dependencies/${dependencyId}`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  logger.log('Template dependency removed:', dependencyId);
}
