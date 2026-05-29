import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';
import type { DocumentType, DocumentTypeDetail, DocumentTypeDetailResponse, DocumentTypesResponse, CreateDocumentTypeData, UpdateDocumentTypeData } from '@/types/document-types';

export type { DocumentType, DocumentTypeDetail, DocumentTypeDetailResponse, DocumentTypesResponse, CreateDocumentTypeData, UpdateDocumentTypeData };

// Get current organization ID from localStorage or context
const getOrganizationId = (): string | null => {
  return localStorage.getItem('selectedOrganizationId');
};

// Get headers with organization ID
const getHeaders = (): Record<string, string> => {
  const orgId = getOrganizationId();
  const headers: Record<string, string> = {};
  
  if (orgId) {
    headers['X-Org-Id'] = orgId;
  }
  
  return headers;
};

// Get all document types
export const getDocumentTypes = async (params?: { search?: string }): Promise<DocumentTypesResponse> => {
  const query = new URLSearchParams()
  if (params?.search?.trim()) query.set('search', params.search.trim())
  const qs = query.toString()

  const response = await httpClient.fetch(`${backendUrl}/document_types/${qs ? `?${qs}` : ''}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  return response.json();
};

// Create new document type
export const createDocumentType = async (data: CreateDocumentTypeData): Promise<DocumentType> => {
  const response = await httpClient.fetch(`${backendUrl}/document_types/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
};

// Get document type by ID
export const getDocumentTypeById = async (id: string): Promise<DocumentTypeDetailResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/document_types/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  return response.json();
};

// Update document type
export const updateDocumentType = async (id: string, data: UpdateDocumentTypeData): Promise<DocumentType> => {
  const response = await httpClient.fetch(`${backendUrl}/document_types/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
};

// Delete document type
export const deleteDocumentType = async (id: string): Promise<void> => {
  await httpClient.fetch(`${backendUrl}/document_types/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
};
