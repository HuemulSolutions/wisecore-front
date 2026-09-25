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
} from '@/types/custom-fields';

// NOTA: el X-Org-Id lo inyecta httpClient desde el contexto de organización
// (ver src/lib/http-client.ts) — no leerlo de localStorage aquí, porque pisa
// ese valor con uno potencialmente obsoleto tras un cambio de organización.

// Get available value sources for custom field templates
export const getCustomFieldTemplateSources = async (): Promise<CustomFieldTemplateSourcesResponse> => {
  const response = await httpClient.get(`${backendUrl}/custom_field_templates/sources`);

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
  const response = await httpClient.get(url);

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
  const response = await httpClient.get(url);

  return response.json();
};

// Get single custom field template
export const getCustomFieldTemplate = async (customFieldTemplateId: string): Promise<CustomFieldTemplate> => {
  const response = await httpClient.get(`${backendUrl}/custom_field_templates/${customFieldTemplateId}`);

  const result: CustomFieldTemplateResponse = await response.json();
  return result.data;
};

// Create new custom field template association
export const createCustomFieldTemplate = async (data: CreateCustomFieldTemplateRequest): Promise<CustomFieldTemplate> => {
  const response = await httpClient.post(`${backendUrl}/custom_field_templates/`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result: CustomFieldTemplateResponse = await response.json();
  return result.data;
};

// Update custom field template association
export const updateCustomFieldTemplate = async (customFieldTemplateId: string, data: UpdateCustomFieldTemplateRequest): Promise<CustomFieldTemplate> => {
  const response = await httpClient.patch(`${backendUrl}/custom_field_templates/${customFieldTemplateId}`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result: CustomFieldTemplateResponse = await response.json();
  return result.data;
};

// Delete custom field template association
export const deleteCustomFieldTemplate = async (customFieldTemplateId: string): Promise<void> => {
  await httpClient.delete(`${backendUrl}/custom_field_templates/${customFieldTemplateId}`);
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
