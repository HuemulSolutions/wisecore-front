import { backendUrl } from "@/config";

export async function getAllDocuments(organizationId?: string) {
  const url = new URL(`${backendUrl}/documents/`);
  if (organizationId) {
    url.searchParams.append('organization_id', organizationId);
  }
  
  const response = await fetch(url.toString());
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

export async function createDocumentSection(sectionData: { name: string; prompt: string; dependencies: string[]; document_id: string }) {
    const response = await fetch(`${backendUrl}/documents/sections/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionData),
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error creating section:', errorResponse);
        throw new Error(errorResponse.detail.error || 'Unknown error');
    }

    const data = await response.json();
    console.log('Section created:', data.data);
    return data.data;
}

export async function createDocument(documentData: { name: string; organization_id: string, description?: string; template_id?: string | null }) {
  const response = await fetch(`${backendUrl}/documents/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

