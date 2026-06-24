import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';
import type { AssetType, AssetTypesResponse, RoleAccess, AssetTypeWithRoles, AssetTypesWithRolesResponse, CreateAssetTypeData, UpdateAssetTypeData, CloneAssetTypeData, LinkedTemplate, DocumentTypeTemplatesResponse } from '@/types/assets';

export type { AssetType, AssetTypesResponse, RoleAccess, AssetTypeWithRoles, AssetTypesWithRolesResponse, CreateAssetTypeData, UpdateAssetTypeData, CloneAssetTypeData, LinkedTemplate, DocumentTypeTemplatesResponse };

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

// Get all asset types
export const getAssetTypes = async (page: number = 1, pageSize: number = 100, search?: string): Promise<AssetTypesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search?.trim()) params.set('search', search.trim());
  const response = await httpClient.get(`${backendUrl}/document_types?${params}`, {
    headers: getHeaders(),
  });
  
  return response.json();
};

// Get all asset types with roles
export const getAssetTypesWithRoles = async (page: number = 1, pageSize: number = 10, search?: string): Promise<AssetTypesWithRolesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });

  if (search) {
    params.append('search', search);
  }

  const response = await httpClient.get(`${backendUrl}/role-doctype/document-types/list_with_all_roles?${params.toString()}`, {
    headers: getHeaders(),
  });
  
  return response.json();
};

// Get single asset type
export const getAssetType = async (id: string): Promise<AssetType> => {
  const response = await httpClient.get(`${backendUrl}/document_types/${id}`, {
    headers: getHeaders(),
  });
  
  return response.json();
};

// Create new asset type
export const createAssetType = async (data: CreateAssetTypeData): Promise<AssetType> => {
  const response = await httpClient.post(`${backendUrl}/document_types`, data, {
    headers: getHeaders(),
  });
  
  return response.json();
};

// Update asset type
export const updateAssetType = async (id: string, data: UpdateAssetTypeData): Promise<AssetType> => {
  const response = await httpClient.put(`${backendUrl}/document_types/${id}`, data, {
    headers: getHeaders(),
  });
  
  return response.json();
};

// Delete asset type
export const deleteAssetType = async (id: string): Promise<void> => {
  await httpClient.delete(`${backendUrl}/document_types/${id}`, {
    headers: getHeaders(),
  });
};

// Clone asset type
export const cloneAssetType = async (id: string, options: CloneAssetTypeData = {}): Promise<AssetType> => {
  const body: CloneAssetTypeData = {};
  if (options.name !== undefined) body.name = options.name;
  if (options.include_relationships !== undefined) {
    body.include_relationships = options.include_relationships;
  }
  const response = await httpClient.post(`${backendUrl}/document_types/${id}/clone`, body, {
    headers: getHeaders(),
  });

  return response.json();
};

// Get templates linked to a document type
export const getDocumentTypeTemplates = async (
  documentTypeId: string,
): Promise<DocumentTypeTemplatesResponse> => {
  const response = await httpClient.get(
    `${backendUrl}/document_types/${documentTypeId}/templates`,
    { headers: getHeaders() },
  );
  return response.json();
};

// Link a template to a document type (requiere permiso asset_type:u)
export const linkTemplateToDocumentType = async (
  documentTypeId: string,
  templateId: string,
): Promise<void> => {
  await httpClient.post(
    `${backendUrl}/document_types/${documentTypeId}/templates/${templateId}`,
    {},
    { headers: getHeaders() },
  );
};

// Unlink a template from a document type (requiere permiso asset_type:u)
export const unlinkTemplateFromDocumentType = async (
  documentTypeId: string,
  templateId: string,
): Promise<void> => {
  await httpClient.delete(
    `${backendUrl}/document_types/${documentTypeId}/templates/${templateId}`,
    { headers: getHeaders() },
  );
};
