import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import type { Dependency, CreateDependencyRequest, UpdateDependencyVersionRequest } from "@/types/dependency/sheets";

export async function getDocumentDependencies(documentId: string, organizationId: string): Promise<Dependency[]> {
  const response = await httpClient.get(`${backendUrl}/documents/${documentId}/dependencies`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  const data = await response.json();
  logger.log('Document dependencies fetched:', data.data);
  return data.data;
}

export async function addDocumentDependency(documentId: string, body: CreateDependencyRequest, organizationId: string): Promise<Dependency> {
  const response = await httpClient.post(`${backendUrl}/documents/${documentId}/dependencies`,
    body,
    {
      headers: {
        'X-Org-Id': organizationId
      }
    }
  );

  const data = await response.json();
  logger.log('Document dependency added:', data.data);
  return data.data;
}

export async function updateDocumentDependency(documentId: string, dependencyId: string, body: UpdateDependencyVersionRequest, organizationId: string): Promise<Dependency> {
  const response = await httpClient.patch(`${backendUrl}/documents/${documentId}/dependencies/${dependencyId}`,
    body,
    {
      headers: {
        'X-Org-Id': organizationId
      }
    }
  );

  const data = await response.json();
  logger.log('Document dependency updated:', data.data);
  return data.data;
}

export async function removeDocumentDependency(documentId: string, dependencyId: string, organizationId: string) {
  await httpClient.delete(`${backendUrl}/documents/${documentId}/dependencies/${dependencyId}`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });

  logger.log('Document dependency removed:', dependencyId);
  return dependencyId;
}
