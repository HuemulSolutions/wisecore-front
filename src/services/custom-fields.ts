import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  CustomField,
  CustomFieldDataType,
  PaginationParams,
  ApiResponse,
  CreateCustomFieldRequest,
  UpdateCustomFieldRequest,
} from "@/types/custom-fields";

export interface CustomFieldsResponse extends ApiResponse<CustomField[]> {}

export interface CustomFieldResponse extends ApiResponse<CustomField> {}

export interface DataTypesResponse extends ApiResponse<CustomFieldDataType[]> {}

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

// Get available data types for custom fields
export const getCustomFieldDataTypes = async (): Promise<DataTypesResponse> => {
  const response = await httpClient.get(`${backendUrl}/custom_fields/data_types`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom field data types');
  }
  
  return response.json();
};

// Get all custom fields with pagination
export const getCustomFields = async (params?: PaginationParams): Promise<CustomFieldsResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params?.page) {
    searchParams.append("page", params.page.toString());
  }
  
  if (params?.page_size) {
    searchParams.append("page_size", params.page_size.toString());
  }

  const url = `${backendUrl}/custom_fields/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await httpClient.get(url, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom fields');
  }
  
  return response.json();
};

// Get single custom field
export const getCustomField = async (id: string): Promise<CustomField> => {
  const response = await httpClient.get(`${backendUrl}/custom_fields/${id}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom field');
  }
  
  const result: CustomFieldResponse = await response.json();
  return result.data;
};

// Create new custom field
export const createCustomField = async (data: CreateCustomFieldRequest): Promise<CustomField> => {
  const response = await httpClient.post(`${backendUrl}/custom_fields/`, data, {
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to create custom field');
  }
  
  const result: CustomFieldResponse = await response.json();
  return result.data;
};

// Update custom field
export const updateCustomField = async (id: string, data: UpdateCustomFieldRequest): Promise<CustomField> => {
  const response = await httpClient.patch(`${backendUrl}/custom_fields/${id}`, data, {
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to update custom field');
  }
  
  const result: CustomFieldResponse = await response.json();
  return result.data;
};

// Delete custom field
export const deleteCustomField = async (id: string): Promise<void> => {
  const response = await httpClient.delete(`${backendUrl}/custom_fields/${id}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete custom field');
  }
};

// Legacy service object for backward compatibility
export const customFieldsService = {
  /**
   * Get available data types for custom fields
   * @deprecated Use getCustomFieldDataTypes instead
   */
  getDataTypes: getCustomFieldDataTypes,

  /**
   * List custom fields with pagination
   * @deprecated Use getCustomFields instead
   */
  getCustomFields: (params?: PaginationParams, _orgId?: string) => getCustomFields(params),

  /**
   * Get a specific custom field by ID
   * @deprecated Use getCustomField instead
   */
  getCustomField: (customFieldId: string, _orgId?: string) => getCustomField(customFieldId),

  /**
   * Create a new custom field
   * @deprecated Use createCustomField instead
   */
  createCustomField: (data: CreateCustomFieldRequest, _orgId?: string) => createCustomField(data),
};