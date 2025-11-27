import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";

export async function getContext(documentId: string) {
  const response = await httpClient.get(`${backendUrl}/context/${documentId}`);
  if (!response.ok) {
    throw new Error('Error al obtener el contexto del documento');
  }
  const data = await response.json();
  console.log('Document context fetched:', data.data);
  return data.data;
}

export async function addTextContext(documentId: string, name: string, content: string) {
  const response = await httpClient.post(`${backendUrl}/context/${documentId}/text`, {
    name,
    content,
  });
  
  if (!response.ok) {
    throw new Error('Error adding text context');
  }
  
  const data = await response.json();
  console.log('Text context added:', data.data);
  return data.data;
}

export async function addDocumentContext(documentId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await httpClient.fetch(`${backendUrl}/context/${documentId}/file`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Error uploading document context');
  }
  
  const data = await response.json();
  console.log('Document context added:', data.data);
  return data.data;
}

export async function deleteContext(contextId: string) {
  const response = await httpClient.delete(`${backendUrl}/context/${contextId}`);
  
  if (!response.ok) {
    throw new Error('Error deleting context');
  }
  
  const data = await response.json();
  console.log('Context deleted:', data.data);
  return data.data;
}
