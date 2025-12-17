import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getContext(documentId: string, organizationId: string) {
  const response = await httpClient.get(`${backendUrl}/context/${documentId}`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  if (!response.ok) {
    throw new Error('Error al obtener el contexto del documento');
  }
  const data = await response.json();
  console.log('Document context fetched:', data.data);
  return data.data;
}

export async function addTextContext(documentId: string, name: string, content: string, organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/context/${documentId}/text`, 
    {
      name,
      content,
    },
    {
      headers: {
        'X-Org-Id': organizationId
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Error adding text context');
  }
  
  const data = await response.json();
  console.log('Text context added:', data.data);
  return data.data;
}

export async function addDocumentContext(documentId: string, file: File, organizationId: string) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await httpClient.fetch(`${backendUrl}/context/${documentId}/file`, {
    method: 'POST',
    body: formData,
    headers: {
      'X-Org-Id': organizationId
    }
  });
  
  if (!response.ok) {
    throw new Error('Error uploading document context');
  }
  
  const data = await response.json();
  console.log('Document context added:', data.data);
  return data.data;
}

export async function deleteContext(contextId: string, organizationId: string) {
  const response = await httpClient.delete(`${backendUrl}/context/${contextId}`, {
    headers: {
      'X-Org-Id': organizationId
    }
  });
  
  if (!response.ok) {
    throw new Error('Error deleting context');
  }
  
  const data = await response.json();
  console.log('Context deleted:', data.data);
  return data.data;
}
