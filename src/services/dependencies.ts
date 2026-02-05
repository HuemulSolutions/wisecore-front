import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getDocumentDependencies(documentId: string, organizationId: string) {
  const response = await httpClient.get(`${backendUrl}/documents/${documentId}/dependencies`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  const data = await response.json();
  console.log('Document dependencies fetched:', data.data);
  return data.data;
}

export async function addDocumentDependency(documentId: string, dependsOnDocumentId: string, organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/documents/${documentId}/dependencies`, 
    { depends_on_document_id: dependsOnDocumentId },
    {
      headers: {
        'X-Org-Id': organizationId
      }
    }
  );

  const data = await response.json();
  console.log('Document dependency added:', data.data);
  return data.data;
}

export async function removeDocumentDependency(documentId: string, dependencyId: string, organizationId: string) {
  await httpClient.delete(`${backendUrl}/documents/${documentId}/dependencies/${dependencyId}`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });

  console.log('Document dependency removed:', dependencyId);
  return dependencyId;
}
