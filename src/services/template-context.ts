import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import type { TemplateContext, CreateTemplateContextRequest, UpdateTemplateContextRequest } from "@/types/templates";

export async function getTemplateContexts(templateId: string, organizationId: string): Promise<TemplateContext[]> {
  const response = await httpClient.get(`${backendUrl}/templates/${templateId}/context`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  const data = await response.json();
  logger.log('Template contexts fetched:', data.data);
  return data.data;
}

export async function createTemplateContext(templateId: string, body: CreateTemplateContextRequest, organizationId: string): Promise<TemplateContext> {
  const response = await httpClient.post(`${backendUrl}/templates/${templateId}/context`, body, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  const data = await response.json();
  logger.log('Template context created:', data.data);
  return data.data;
}

export async function updateTemplateContext(templateId: string, contextId: string, body: UpdateTemplateContextRequest, organizationId: string): Promise<TemplateContext> {
  const response = await httpClient.patch(`${backendUrl}/templates/${templateId}/context/${contextId}`, body, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  const data = await response.json();
  logger.log('Template context updated:', data.data);
  return data.data;
}

export async function deleteTemplateContext(templateId: string, contextId: string, organizationId: string): Promise<void> {
  await httpClient.delete(`${backendUrl}/templates/${templateId}/context/${contextId}`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  logger.log('Template context deleted:', contextId);
}
