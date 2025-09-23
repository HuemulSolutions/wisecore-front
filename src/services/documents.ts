import { backendUrl } from "@/config";

export async function getAllDocuments(organizationId: string, documentTypeId?: string) {
  const url = new URL(`${backendUrl}/documents/`);
  if (documentTypeId) {
    url.searchParams.append('document_type_id', documentTypeId);
  }
  
  const headers: Record<string, string> = {};
  if (organizationId) {
    headers['OrganizationId'] = organizationId;
  }
  
  const response = await fetch(url.toString(), {
    headers,
  });
  if (!response.ok) {
    throw new Error('Error al obtener los documentos');
  }
  const data = await response.json();
  console.log('Documents fetched:', data.data);
  return data.data;
}

export async function getDocumentById(documentId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}`);
  if (!response.ok) {
    throw new Error('Error al obtener el documento');
  }
  const data = await response.json();
  console.log('Document fetched:', data.data);
  return data.data;
}

export async function deleteDocument(documentId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Error al eliminar el documento');
  }
  console.log('Document deleted:', documentId);
  return true;
}

export async function getDocumentSections(documentId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}/sections`);
  if (!response.ok) {
    throw new Error('Error al obtener las secciones del documento');
  }
  const data = await response.json();
  console.log('Document sections fetched:', data.data);
  return data.data;
}

export async function createDocument(documentData: { name: string; description?: string; 
  template_id?: string | null; document_type_id?: string, folder_id?: string }, organizationId: string) {
  const response = await fetch(`${backendUrl}/documents/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'OrganizationId': organizationId,
    },
    body: JSON.stringify(documentData),
  });

  if (!response.ok) {
    throw new Error('Error al crear el documento');
  }

  const data = await response.json();
  console.log('Document created:', data.data);
  return data.data;
}

export async function getDocumentContent(documentId: string, executionId?: string) {
  const url = new URL(`${backendUrl}/documents/content`);
  url.searchParams.append('document_id', documentId);
  if (executionId) {
    url.searchParams.append('execution_id', executionId);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Error al obtener el contenido del documento');
  } 
  const data = await response.json();
  console.log('Document content fetched:', data.data);
  return data.data;
}


export async function generateDocumentStructure(documentId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Error al generar la estructura del documento');
  }

  const data = await response.json();
  console.log('Document structure generation initiated:', data);
  return data;
}

