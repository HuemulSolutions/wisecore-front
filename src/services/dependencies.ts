import { backendUrl } from "@/config";

export async function getDocumentDependencies(documentId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}/dependencies`);
  if (!response.ok) {
    throw new Error('Error al obtener las dependencias del documento');
  }
  const data = await response.json();
  console.log('Document dependencies fetched:', data.data);
  return data.data;
}

export async function addDocumentDependency(documentId: string, dependsOnDocumentId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}/dependencies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ depends_on_document_id: dependsOnDocumentId }),
  });

  if (!response.ok) {
    throw new Error('Error al agregar la dependencia del documento');
  }

  const data = await response.json();
  console.log('Document dependency added:', data.data);
  return data.data;
}

export async function removeDocumentDependency(documentId: string, dependencyId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}/dependencies/${dependencyId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Error al eliminar la dependencia del documento');
  }

  console.log('Document dependency removed:', dependencyId);
  return dependencyId;
}