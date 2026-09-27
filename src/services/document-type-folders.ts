import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';
import type {
  DocumentTypeFolder,
  DocumentTypeFoldersResponse,
  DocumentTypeFolderResponse,
  CreateDocumentTypeFolderData,
  UpdateDocumentTypeFolderData,
  AssignDocumentTypesToFolderData,
} from '@/types/document-type-folders';
import type { DocumentType, DocumentTypesResponse } from '@/types/document-types';

export type {
  DocumentTypeFolder,
  DocumentTypeFoldersResponse,
  DocumentTypeFolderResponse,
  CreateDocumentTypeFolderData,
  UpdateDocumentTypeFolderData,
  AssignDocumentTypesToFolderData,
};

// Nota: X-Org-Id lo inyecta httpClient desde el contexto de organización activa
// (ver src/lib/http-client.ts). No pasarlo a mano.

// Get all document type folders
export const getDocumentTypeFolders = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<DocumentTypeFoldersResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.page_size) query.set('page_size', params.page_size.toString());
  if (params?.search?.trim()) query.set('search', params.search.trim());
  const qs = query.toString();

  const response = await httpClient.get(`${backendUrl}/document_type_folders/${qs ? `?${qs}` : ''}`);

  return response.json();
};

// Get single document type folder (sin document_type_count)
export const getDocumentTypeFolder = async (id: string): Promise<DocumentTypeFolder> => {
  const response = await httpClient.get(`${backendUrl}/document_type_folders/${id}`);
  const json: DocumentTypeFolderResponse = await response.json();
  return json.data;
};

// Create new document type folder
export const createDocumentTypeFolder = async (
  data: CreateDocumentTypeFolderData,
): Promise<DocumentTypeFolder> => {
  const response = await httpClient.post(`${backendUrl}/document_type_folders/`, data);
  const json: DocumentTypeFolderResponse = await response.json();
  return json.data;
};

// Update document type folder
export const updateDocumentTypeFolder = async (
  id: string,
  data: UpdateDocumentTypeFolderData,
): Promise<DocumentTypeFolder> => {
  const response = await httpClient.patch(`${backendUrl}/document_type_folders/${id}`, data);
  const json: DocumentTypeFolderResponse = await response.json();
  return json.data;
};

// Delete document type folder (no borra los tipos de documento — quedan sin carpeta)
export const deleteDocumentTypeFolder = async (id: string): Promise<void> => {
  await httpClient.delete(`${backendUrl}/document_type_folders/${id}`);
};

// Get document types contained in a folder
export const getFolderDocumentTypes = async (folderId: string): Promise<DocumentType[]> => {
  const response = await httpClient.get(`${backendUrl}/document_type_folders/${folderId}/document_types`);
  const json: DocumentTypesResponse = await response.json();
  return json.data;
};

// Assign (mover) document types a una carpeta, sacándolos de cualquier carpeta anterior
export const assignDocumentTypesToFolder = async (
  folderId: string,
  data: AssignDocumentTypesToFolderData,
): Promise<DocumentType[]> => {
  const response = await httpClient.post(`${backendUrl}/document_type_folders/${folderId}/document_types`, data);
  const json: DocumentTypesResponse = await response.json();
  return json.data;
};

// Sacar un tipo de documento de una carpeta puntual
export const removeDocumentTypeFromFolder = async (
  folderId: string,
  documentTypeId: string,
): Promise<void> => {
  await httpClient.delete(`${backendUrl}/document_type_folders/${folderId}/document_types/${documentTypeId}`);
};
