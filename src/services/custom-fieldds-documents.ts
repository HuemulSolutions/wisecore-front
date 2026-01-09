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
} from "@/types/custom-fields-documents";

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

// Get available value sources for custom field documents
export const getCustomFieldDocumentSources = async (): Promise<CustomFieldDocumentSourcesResponse> => {
  const response = await httpClient.get(`${backendUrl}/custom_field_documents/sources`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom field document sources');
  }
  
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

  const url = `${backendUrl}/custom_field_documents/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await httpClient.get(url, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom field documents');
  }
  
  return response.json();
};

// Create new custom field document association
export const createCustomFieldDocument = async (data: CreateCustomFieldDocumentRequest): Promise<CustomFieldDocument> => {
  const response = await httpClient.post(`${backendUrl}/custom_field_documents/`, data, {
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to create custom field document');
  }
  
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
  const response = await httpClient.get(url, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom field documents by document');
  }
  
  return response.json();
};

// Update custom field document association
export const updateCustomFieldDocument = async (customFieldDocumentId: string, data: UpdateCustomFieldDocumentRequest): Promise<CustomFieldDocument> => {
  const response = await httpClient.patch(`${backendUrl}/custom_field_documents/${customFieldDocumentId}`, data, {
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to update custom field document');
  }
  
  const result: CustomFieldDocumentResponse = await response.json();
  return result.data;
};

// Delete custom field document association
export const deleteCustomFieldDocument = async (customFieldDocumentId: string): Promise<void> => {
  const response = await httpClient.delete(`${backendUrl}/custom_field_documents/${customFieldDocumentId}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete custom field document');
  }
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

// Legacy service object for backward compatibility
export const customFieldDocumentsService = {
  /**
   * Get available value sources for custom field documents
   * @deprecated Use getCustomFieldDocumentSources instead
   */
  getSources: getCustomFieldDocumentSources,

  /**
   * List custom field documents with pagination and filtering
   * @deprecated Use getCustomFieldDocuments instead
   */
  getCustomFieldDocuments: (params?: CustomFieldDocumentListParams) => getCustomFieldDocuments(params),

  /**
   * Get custom field documents by document ID
   * @deprecated Use getCustomFieldDocumentsByDocument instead
   */
  getByDocument: (params: CustomFieldDocumentByDocumentParams) => getCustomFieldDocumentsByDocument(params),

  /**
   * Create a new custom field document association
   * @deprecated Use createCustomFieldDocument instead
   */
  createCustomFieldDocument: (data: CreateCustomFieldDocumentRequest) => createCustomFieldDocument(data),

  /**
   * Update a custom field document association
   * @deprecated Use updateCustomFieldDocument instead
   */
  updateCustomFieldDocument: (customFieldDocumentId: string, data: UpdateCustomFieldDocumentRequest) => updateCustomFieldDocument(customFieldDocumentId, data),

  /**
   * Delete a custom field document association
   * @deprecated Use deleteCustomFieldDocument instead
   */
  deleteCustomFieldDocument: (customFieldDocumentId: string) => deleteCustomFieldDocument(customFieldDocumentId),

  /**
   * Upload file for custom field document
   * @deprecated Use uploadCustomFieldDocumentValueBlob instead
   */
  uploadValueBlob: (customFieldDocumentId: string, file: File) => uploadCustomFieldDocumentValueBlob(customFieldDocumentId, file, getOrganizationId()!),
};