import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';
import type { DocumentType, DocumentTypeDetail, DocumentTypeDetailResponse, DocumentTypesResponse, CreateDocumentTypeData, UpdateDocumentTypeData } from '@/types/document-types';

export type { DocumentType, DocumentTypeDetail, DocumentTypeDetailResponse, DocumentTypesResponse, CreateDocumentTypeData, UpdateDocumentTypeData };

// Nota: X-Org-Id lo inyecta httpClient desde el contexto de organización activa
// (ver src/lib/http-client.ts). No pasarlo a mano leyendo localStorage: ese header
// gana sobre el de httpClient y puede servir una organización obsoleta tras un
// cambio de organización activa.

// Get all document types
export const getDocumentTypes = async (params?: {
  page?: number
  page_size?: number
  search?: string
  tag_id?: string
  document_type_folder_id?: string
}): Promise<DocumentTypesResponse> => {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', params.page.toString())
  if (params?.page_size) query.set('page_size', params.page_size.toString())
  if (params?.search?.trim()) query.set('search', params.search.trim())
  if (params?.tag_id) query.set('tag_id', params.tag_id)
  if (params?.document_type_folder_id) query.set('document_type_folder_id', params.document_type_folder_id)
  const qs = query.toString()

  const response = await httpClient.fetch(`${backendUrl}/document_types/${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });

  return response.json();
};

// Create new document type
export const createDocumentType = async (data: CreateDocumentTypeData): Promise<DocumentType> => {
  const response = await httpClient.fetch(`${backendUrl}/document_types/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  const json = await response.json();
  return json.data;
};

// Get document type by ID
export const getDocumentTypeById = async (id: string): Promise<DocumentTypeDetailResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/document_types/${id}`, {
    method: 'GET',
  });

  return response.json();
};

// Update document type
export const updateDocumentType = async (id: string, data: UpdateDocumentTypeData): Promise<DocumentType> => {
  const response = await httpClient.fetch(`${backendUrl}/document_types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  const json = await response.json();
  return json.data;
};

// Delete document type
export const deleteDocumentType = async (id: string): Promise<void> => {
  await httpClient.fetch(`${backendUrl}/document_types/${id}`, {
    method: 'DELETE',
  });
};
