import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';
import type { AssetType, AssetTypesResponse, RoleAccess, AssetTypeWithRoles, AssetTypesWithRolesResponse, CreateAssetTypeData, UpdateAssetTypeData, CloneAssetTypeData, LinkedTemplate, DocumentTypeTemplatesResponse, DocumentTypeTemplateLinkBody, ExportAssetTypesBody, ImportAssetTypesQueryParams, ImportAssetTypesData, ImportAssetTypesResponse } from '@/types/assets';

export type { AssetType, AssetTypesResponse, RoleAccess, AssetTypeWithRoles, AssetTypesWithRolesResponse, CreateAssetTypeData, UpdateAssetTypeData, CloneAssetTypeData, LinkedTemplate, DocumentTypeTemplatesResponse, ExportAssetTypesBody, ImportAssetTypesQueryParams, ImportAssetTypesData, ImportAssetTypesResponse };

// Nota: X-Org-Id lo inyecta httpClient desde el contexto de organización activa
// (ver src/lib/http-client.ts). No pasarlo a mano leyendo localStorage: ese header
// gana sobre el de httpClient y puede servir una organización obsoleta tras un
// cambio de organización activa.

// Get all asset types
export const getAssetTypes = async (page: number = 1, pageSize: number = 100, search?: string, tagId?: string): Promise<AssetTypesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search?.trim()) params.set('search', search.trim());
  if (tagId) params.set('tag_id', tagId);
  const response = await httpClient.get(`${backendUrl}/document_types?${params}`);

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

  const response = await httpClient.get(`${backendUrl}/role-doctype/document-types/list_with_all_roles?${params.toString()}`);

  return response.json();
};

// Get single asset type
export const getAssetType = async (id: string): Promise<AssetType> => {
  const response = await httpClient.get(`${backendUrl}/document_types/${id}`);

  return response.json();
};

// Create new asset type
export const createAssetType = async (data: CreateAssetTypeData): Promise<AssetType> => {
  const response = await httpClient.post(`${backendUrl}/document_types`, data);

  return response.json();
};

// Update asset type
export const updateAssetType = async (id: string, data: UpdateAssetTypeData): Promise<AssetType> => {
  const response = await httpClient.put(`${backendUrl}/document_types/${id}`, data);

  return response.json();
};

// Delete asset type
export const deleteAssetType = async (id: string): Promise<void> => {
  await httpClient.delete(`${backendUrl}/document_types/${id}`);
};

// Clone asset type
export const cloneAssetType = async (id: string, options: CloneAssetTypeData = {}): Promise<AssetType> => {
  const body: CloneAssetTypeData = {};
  if (options.name !== undefined) body.name = options.name;
  if (options.include_relationships !== undefined) {
    body.include_relationships = options.include_relationships;
  }
  const response = await httpClient.post(`${backendUrl}/document_types/${id}/clone`, body);

  return response.json();
};

// Get templates linked to a document type
export const getDocumentTypeTemplates = async (
  documentTypeId: string,
): Promise<DocumentTypeTemplatesResponse> => {
  const response = await httpClient.get(`${backendUrl}/document_types/${documentTypeId}/templates`);
  return response.json();
};

// Link a template to a document type (requiere permiso asset_type:u)
export const linkTemplateToDocumentType = async (
  documentTypeId: string,
  templateId: string,
  body: DocumentTypeTemplateLinkBody = {},
): Promise<void> => {
  await httpClient.post(`${backendUrl}/document_types/${documentTypeId}/templates/${templateId}`, body);
};

// Update a document type's template link configuration (requiere permiso asset_type:u)
export const updateDocumentTypeTemplate = async (
  documentTypeId: string,
  templateId: string,
  body: DocumentTypeTemplateLinkBody,
): Promise<void> => {
  await httpClient.patch(`${backendUrl}/document_types/${documentTypeId}/templates/${templateId}`, body);
};

// Unlink a template from a document type (requiere permiso asset_type:u)
export const unlinkTemplateFromDocumentType = async (
  documentTypeId: string,
  templateId: string,
): Promise<void> => {
  await httpClient.delete(`${backendUrl}/document_types/${documentTypeId}/templates/${templateId}`);
};

// Export asset types as a downloadable JSON file (requiere permiso asset_type:r)
export const exportAssetTypes = async (body: ExportAssetTypesBody): Promise<void> => {
  const response = await httpClient.post(`${backendUrl}/document_types/export`, body);

  const blob = await response.blob();
  const contentDisposition = response.headers.get('content-disposition');

  let filename = 'document_types_export.json';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="([^"]+)"/) ||
                  contentDisposition.match(/filename=([^;]+)/);
    if (match?.[1]) filename = match[1].trim();
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Import asset types from a JSON file (requiere permiso asset_type:c + asset_type:u)
export const importAssetTypes = async (
  file: File,
  params: ImportAssetTypesQueryParams = {},
): Promise<ImportAssetTypesData> => {
  const url = new URL(`${backendUrl}/document_types/import`);
  if (params.on_conflict) url.searchParams.append('on_conflict', params.on_conflict);
  if (params.document_type_ids?.length) {
    url.searchParams.append('document_type_ids', params.document_type_ids.join(','));
  }
  if (params.include_lifecycle !== undefined) {
    url.searchParams.append('include_lifecycle', String(params.include_lifecycle));
  }
  if (params.include_relationships !== undefined) {
    url.searchParams.append('include_relationships', String(params.include_relationships));
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient.fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.data;
};
