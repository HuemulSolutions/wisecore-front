import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getDocumentDependencies(documentId: string, organizationId: string) {
  const response = await httpClient.get(`${backendUrl}/documents/${documentId}/dependencies`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  if (!response.ok) {
    throw new Error('Error al obtener las dependencias del documento');
  }
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

  if (!response.ok) {
    throw new Error('Error al agregar la dependencia del documento');
  }

  const data = await response.json();
  console.log('Document dependency added:', data.data);
  return data.data;
}

export async function removeDocumentDependency(documentId: string, dependencyId: string, organizationId: string) {
  const response = await httpClient.delete(`${backendUrl}/documents/${documentId}/dependencies/${dependencyId}`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });

  if (!response.ok) {
    throw new Error('Error al eliminar la dependencia del documento');
  }

  console.log('Document dependency removed:', dependencyId);
  return dependencyId;
}