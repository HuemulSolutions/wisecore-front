import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import type {
  CustomFieldTemplateSourcesResponse,
  CustomFieldTemplatesResponse,
  CustomFieldTemplateResponse,
  CustomFieldTemplateListParams,
  CustomFieldTemplateByTemplateParams,
  CustomFieldTemplate,
  CreateCustomFieldTemplateRequest,
  UpdateCustomFieldTemplateRequest,
} from "@/types/custom-fields-templates";

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

// Get available value sources for custom field templates
export const getCustomFieldTemplateSources = async (): Promise<CustomFieldTemplateSourcesResponse> => {
  const response = await httpClient.get(`${backendUrl}/custom_field_templates/sources`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom field template sources');
  }
  
  return response.json();
};

// Get all custom field templates with pagination and filtering
export const getCustomFieldTemplates = async (params?: CustomFieldTemplateListParams): Promise<CustomFieldTemplatesResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params?.page) {
    searchParams.append("page", params.page.toString());
  }
  
  if (params?.page_size) {
    searchParams.append("page_size", params.page_size.toString());
  }

  if (params?.template_id) {
    searchParams.append("template_id", params.template_id);
  }

  const url = `${backendUrl}/custom_field_templates/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await httpClient.get(url, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom field templates');
  }
  
  return response.json();
};

// Get custom field templates by template ID
export const getCustomFieldTemplatesByTemplate = async (params: CustomFieldTemplateByTemplateParams): Promise<CustomFieldTemplatesResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page !== undefined) {
    searchParams.append("page", params.page.toString());
  }
  
  if (params.page_size !== undefined) {
    searchParams.append("page_size", params.page_size.toString());
  }

  const url = `${backendUrl}/custom_field_templates/by_template/${params.template_id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await httpClient.get(url, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom field templates by template');
  }
  
  return response.json();
};

// Get single custom field template
export const getCustomFieldTemplate = async (customFieldTemplateId: string): Promise<CustomFieldTemplate> => {
  const response = await httpClient.get(`${backendUrl}/custom_field_templates/${customFieldTemplateId}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch custom field template');
  }
  
  const result: CustomFieldTemplateResponse = await response.json();
  return result.data;
};

// Create new custom field template association
export const createCustomFieldTemplate = async (data: CreateCustomFieldTemplateRequest): Promise<CustomFieldTemplate> => {
  const response = await httpClient.post(`${backendUrl}/custom_field_templates/`, data, {
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to create custom field template');
  }
  
  const result: CustomFieldTemplateResponse = await response.json();
  return result.data;
};

// Update custom field template association
export const updateCustomFieldTemplate = async (customFieldTemplateId: string, data: UpdateCustomFieldTemplateRequest): Promise<CustomFieldTemplate> => {
  const response = await httpClient.patch(`${backendUrl}/custom_field_templates/${customFieldTemplateId}`, data, {
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to update custom field template');
  }
  
  const result: CustomFieldTemplateResponse = await response.json();
  return result.data;
};

// Delete custom field template association
export const deleteCustomFieldTemplate = async (customFieldTemplateId: string): Promise<void> => {
  const response = await httpClient.delete(`${backendUrl}/custom_field_templates/${customFieldTemplateId}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete custom field template');
  }
};

// Upload image file for custom field template
export const uploadCustomFieldTemplateValueBlob = async (customFieldTemplateId: string, file: File, organizationId: string): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file, file.name);
  
  // Use fetch directly to avoid httpClient potentially interfering with FormData
  const response = await httpClient.fetch(`${backendUrl}/custom_field_templates/${customFieldTemplateId}/value_blob`, {
    method: 'POST',
    headers: {
      'X-Org-Id': organizationId
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload custom field template image: ${errorText}`);
  }
};

// Legacy service object for backward compatibility
export const customFieldTemplatesService = {
  /**
   * Get available value sources for custom field templates
   * @deprecated Use getCustomFieldTemplateSources instead
   */
  getSources: getCustomFieldTemplateSources,

  /**
   * List custom field templates with pagination and filtering
   * @deprecated Use getCustomFieldTemplates instead
   */
  getCustomFieldTemplates: (params?: CustomFieldTemplateListParams) => getCustomFieldTemplates(params),

  /**
   * Get custom field templates by template ID
   * @deprecated Use getCustomFieldTemplatesByTemplate instead
   */
  getByTemplate: (params: CustomFieldTemplateByTemplateParams) => getCustomFieldTemplatesByTemplate(params),

  /**
   * Get a specific custom field template by ID
   * @deprecated Use getCustomFieldTemplate instead
   */
  getCustomFieldTemplate: (customFieldTemplateId: string) => getCustomFieldTemplate(customFieldTemplateId),

  /**
   * Create a new custom field template association
   * @deprecated Use createCustomFieldTemplate instead
   */
  createCustomFieldTemplate: (data: CreateCustomFieldTemplateRequest) => createCustomFieldTemplate(data),

  /**
   * Update a custom field template association
   * @deprecated Use updateCustomFieldTemplate instead
   */
  updateCustomFieldTemplate: (customFieldTemplateId: string, data: UpdateCustomFieldTemplateRequest) => updateCustomFieldTemplate(customFieldTemplateId, data),

  /**
   * Delete a custom field template association
   * @deprecated Use deleteCustomFieldTemplate instead
   */
  deleteCustomFieldTemplate: (customFieldTemplateId: string) => deleteCustomFieldTemplate(customFieldTemplateId),

  /**
   * Upload image file for custom field template
   * @deprecated Use uploadCustomFieldTemplateValueBlob instead
   */
  uploadValueBlob: (customFieldTemplateId: string, file: File) => uploadCustomFieldTemplateValueBlob(customFieldTemplateId, file, getOrganizationId()!),
};