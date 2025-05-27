import { backendUrl } from "@/config";

export async function getAllDocuments() {
  const response = await fetch(`${backendUrl}/documents/`);
  if (!response.ok) {
    throw new Error('Error al obtener los documentos');
  }
  const data = await response.json();
  return data.data;
}

export async function getDocumentById(documentId: string) {
  const response = await fetch(`${backendUrl}/document/${documentId}`);
  if (!response.ok) {
    throw new Error('Error al obtener el documento');
  }
  const data = await response.json();
  return data.data;
}

export async function getDocumentSections(documentId: string) {
  const response = await fetch(`${backendUrl}/documents/${documentId}/sections`);
  if (!response.ok) {
    throw new Error('Error al obtener las secciones del documento');
  }
  const data = await response.json();
  return data.data;
}

