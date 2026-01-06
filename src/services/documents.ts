import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getAllDocuments(organizationId: string, documentTypeId?: string) {
  const url = new URL(`${backendUrl}/documents/`);
  if (documentTypeId) {
    url.searchParams.append('document_type_id', documentTypeId);
  }
  
  const headers: Record<string, string> = {};
  if (organizationId) {
    headers['X-Org-Id'] = organizationId;
  }
  
  const response = await httpClient.get(url.toString(), {
    headers,
  });
  if (!response.ok) {
    throw new Error('Error al obtener los documentos');
  }
  const data = await response.json();
  console.log('Documents fetched:', data.data);
  return data.data;
}

export async function getDocumentById(documentId: string, organizationId: string) {
  const response = await httpClient.get(`${backendUrl}/documents/${documentId}`, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  if (!response.ok) {
    throw new Error('Error al obtener el documento');
  }
  const data = await response.json();
  console.log('Document fetched:', data.data);
  return data.data;
}

export async function deleteDocument(documentId: string, organizationId: string) {
  const response = await httpClient.delete(`${backendUrl}/documents/${documentId}`, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  if (!response.ok) {
    throw new Error('Error al eliminar el documento');
  }
  console.log('Document deleted:', documentId);
  return true;
}

export async function getDocumentSections(documentId: string, organizationId: string) {
  const response = await httpClient.get(`${backendUrl}/documents/${documentId}/sections`, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  if (!response.ok) {
    throw new Error('Error al obtener las secciones del documento');
  }
  const data = await response.json();
  console.log('Document sections fetched:', data.data);
  return data.data;
}

export async function createDocument(documentData: { name: string; description?: string; 
  template_id?: string | null; document_type_id?: string, folder_id?: string }, organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/documents/`, documentData, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error('Error creating document:', errorResponse);
    throw new Error(errorResponse.error || 'Unknown error');
  }

  const data = await response.json();
  console.log('Document created:', data.data);
  return data.data;
}

export async function getDocumentContent(documentId: string, organizationId: string, executionId?: string) {
  const url = new URL(`${backendUrl}/documents/${documentId}/content`);
  if (executionId) {
    url.searchParams.append('execution_id', executionId);
  }

  const response = await httpClient.get(url.toString(), {
    headers: {
      'X-Org-Id': organizationId,
    },
  });
  if (!response.ok) {
    throw new Error('Error al obtener el contenido del documento');
  } 
  const data = await response.json();
  console.log('Document content fetched:', data.data);
  return data.data;
}


export async function generateDocumentStructure(documentId: string, organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/documents/${documentId}/generate`, {}, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  if (!response.ok) {
    throw new Error('Error al generar la estructura del documento');
  }

  const data = await response.json();
  console.log('Document structure generation initiated:', data);
  return data;
}

export async function updateDocument(
  documentId: string, 
  documentData: { name?: string; description?: string }, 
  organizationId: string
) {
  const response = await httpClient.put(`${backendUrl}/documents/${documentId}`, documentData, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error('Error updating document:', errorResponse);
    throw new Error(errorResponse.error || 'Error al actualizar el documento');
  }

  const data = await response.json();
  console.log('Document updated:', data.data);
  return data.data;
}

export async function moveDocument(documentId: string, newParentId: string | undefined, organizationId: string) {
  console.log('Moving document:', documentId, 'to parent:', newParentId);
  
  const response = await httpClient.put(`${backendUrl}/documents/${documentId}/move`, {
    folder_id: newParentId === undefined ? null : newParentId,
  }, {
    headers: {
      'X-Org-Id': organizationId,
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error('Error moving document:', errorResponse);
    throw new Error(errorResponse.error || 'Error al mover el documento');
  }

  const data = await response.json();
  console.log('Document moved:', data.data);
  return data.data;
}




