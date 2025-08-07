import { backendUrl } from "@/config";

export async function getContext(documentId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}/context`);
  if (!response.ok) {
    throw new Error('Error al obtener el contexto del documento');
  }
  const data = await response.json();
  console.log('Document context fetched:', data.data);
  return data.data;
}

export async function addTextContext(documentId: string, name: string, content: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}/add_context_text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      content,
    }),
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
  
  const response = await fetch(`${backendUrl}/documents/${documentId}/add_context_file`, {
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

export async function deleteContext(documentId: string, contextId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}/context/${contextId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Error deleting context');
  }
  
  const data = await response.json();
  console.log('Context deleted:', data.data);
  return data.data;
}
