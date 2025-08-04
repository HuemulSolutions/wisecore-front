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