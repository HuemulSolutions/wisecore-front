import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { ApiError } from "@/types/api-error";
import type {
  CustomField,
  CustomFieldDataType,
  CustomFieldQuestionType,
  PaginationParams,
  ApiResponse,
  CreateCustomFieldRequest,
  UpdateCustomFieldRequest,
  CustomFieldsResponse,
} from "@/types/custom-fields";

// Type aliases for API responses
export type CustomFieldResponse = ApiResponse<CustomField>;
export type DataTypesResponse = ApiResponse<CustomFieldDataType[]>;
export type QuestionTypesResponse = ApiResponse<CustomFieldQuestionType[]>;

// El X-Org-Id lo inyecta httpClient desde el contexto de organización.

// Get available data types for custom fields
export const getCustomFieldDataTypes = async (): Promise<DataTypesResponse> => {
  const response = await httpClient.get(`${backendUrl}/custom_fields/data_types`);

  return response.json();
};

// Get available question types for custom fields (drives data_type derivation)
export const getCustomFieldQuestionTypes = async (): Promise<QuestionTypesResponse> => {
  const response = await httpClient.get(`${backendUrl}/custom_fields/question_types`);

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

  if (params?.search) {
    searchParams.append("search", params.search);
  }

  const url = `${backendUrl}/custom_fields/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  const response = await httpClient.get(url);

  return response.json();
};

// Get single custom field
export const getCustomField = async (id: string): Promise<CustomField> => {
  const response = await httpClient.get(`${backendUrl}/custom_fields/${id}`);

  const result: CustomFieldResponse = await response.json();
  return result.data;
};

// Create new custom field
export const createCustomField = async (data: CreateCustomFieldRequest): Promise<CustomField> => {
  const response = await httpClient.post(`${backendUrl}/custom_fields/`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result: CustomFieldResponse = await response.json();
  return result.data;
};

// Update custom field
export const updateCustomField = async (id: string, data: UpdateCustomFieldRequest): Promise<CustomField> => {
  const response = await httpClient.patch(`${backendUrl}/custom_fields/${id}`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  const result: CustomFieldResponse = await response.json();
  return result.data;
};

// Delete custom field. force=true elimina también sus asociaciones en
// custom_field_templates / custom_field_documents (no borra los templates ni
// los documentos, solo la asignación de este campo en ellos).
export const deleteCustomField = async (id: string, force = false): Promise<void> => {
  const query = force ? "?force=true" : "";
  await httpClient.delete(`${backendUrl}/custom_fields/${id}${query}`);
};

export interface CustomFieldUsage {
  templates: number;
  documents: number;
}

/**
 * El backend responde 400 con error.detail = { templates, documents } cuando
 * el custom field está en uso y se intentó borrar sin force=true. ApiError
 * normaliza ese detail a un string JSON (ver normalizeDetail en api-error.ts),
 * así que hay que parsearlo de vuelta. Devuelve null si el error no es ese caso.
 */
export const parseCustomFieldUsageError = (error: unknown): CustomFieldUsage | null => {
  if (!ApiError.isApiError(error) || error.statusCode !== 400 || !error.detail) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(error.detail);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const { templates, documents } = parsed as Record<string, unknown>;
  if (typeof templates !== "number" && typeof documents !== "number") {
    return null;
  }

  return {
    templates: typeof templates === "number" ? templates : 0,
    documents: typeof documents === "number" ? documents : 0,
  };
};
