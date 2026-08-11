import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  CustomFieldDocumentSourcesResponse,
  CustomFieldDocumentsResponse,
  CustomFieldDocumentResponse,
  CustomFieldDocumentListParams,
  CustomFieldDocumentByDocumentParams,
  CustomFieldDocument,
  CreateCustomFieldDocumentRequest,
  UpdateCustomFieldDocumentRequest,
} from '@/types/custom-fields';

// El X-Org-Id lo inyecta httpClient desde el contexto de organización.

// Get available value sources for custom field documents
export const getCustomFieldDocumentSources = async (): Promise<CustomFieldDocumentSourcesResponse> => {
  const response = await httpClient.get(`${backendUrl}/custom_field_documents/sources`);

  return response.json();
};

// Get all custom field documents with pagination and filtering
export const getCustomFieldDocuments = async (params?: CustomFieldDocumentListParams): Promise<CustomFieldDocumentsResponse> => {
  const searchParams = new URLSearchParams();

  if (params?.page) {
    searchParams.append("page", params.page.toString());
  }

  if (params?.page_size) {
    searchParams.append("page_size", params.page_size.toString());
  }

  if (params?.document_id) {
    searchParams.append("document_id", params.document_id);
  }

  if (params?.search?.trim()) {
    searchParams.append("search", params.search.trim());
  }

  const url = `${backendUrl}/custom_field_documents/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await httpClient.get(url);

  return response.json();
};

// Create new custom field document association
export const createCustomFieldDocument = async (data: CreateCustomFieldDocumentRequest): Promise<CustomFieldDocument> => {
  const response = await httpClient.post(`${backendUrl}/custom_field_documents/`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result: CustomFieldDocumentResponse = await response.json();
  return result.data;
};

// Get custom field documents by document ID
export const getCustomFieldDocumentsByDocument = async (params: CustomFieldDocumentByDocumentParams): Promise<CustomFieldDocumentsResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.append("page", params.page.toString());
  }

  if (params.page_size !== undefined) {
    searchParams.append("page_size", params.page_size.toString());
  }

  const url = `${backendUrl}/custom_field_documents/by_document/${params.document_id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await httpClient.get(url);

  return response.json();
};

// Update custom field document association
export const updateCustomFieldDocument = async (customFieldDocumentId: string, data: UpdateCustomFieldDocumentRequest): Promise<CustomFieldDocument> => {
  const response = await httpClient.patch(`${backendUrl}/custom_field_documents/${customFieldDocumentId}`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result: CustomFieldDocumentResponse = await response.json();
  return result.data;
};

// Delete custom field document association
export const deleteCustomFieldDocument = async (customFieldDocumentId: string): Promise<void> => {
  await httpClient.delete(`${backendUrl}/custom_field_documents/${customFieldDocumentId}`);
};

// Upload file for custom field document
export const uploadCustomFieldDocumentValueBlob = async (customFieldDocumentId: string, file: File, organizationId: string): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file, file.name);
  
  // Use fetch directly to avoid httpClient potentially interfering with FormData
  const response = await httpClient.fetch(`${backendUrl}/custom_field_documents/${customFieldDocumentId}/value_blob`, {
    method: 'POST',
    headers: {
      'X-Org-Id': organizationId
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload custom field document file: ${errorText}`);
  }
};
