import type { PaginationParams, ApiResponse, CustomFieldOption } from './core'

export type CustomFieldDocumentSource = "manual" | "inferred";

export interface CustomFieldDocument {
  id: string;
  document_id: string;
  custom_field_id: string;
  name: string;
  description: string;
  required: boolean;
  prompt: string;
  value: string;
  value_string: string;
  value_date: string | null;
  value_time: string | null;
  value_datetime: string | null;
  value_url: string | null;
  value_number: number | null;
  value_bool: boolean | null;
  value_identifier: string | null;
  options?: CustomFieldOption[];
  source: CustomFieldDocumentSource;
  created_at: string;
  updated_at: string;
  data_type: string;
}

export interface CustomFieldDocumentListParams extends PaginationParams {
  document_id?: string | null;
}

export interface CustomFieldDocumentByDocumentParams extends PaginationParams {
  document_id: string;
}

export type CustomFieldDocumentSourcesResponse = ApiResponse<CustomFieldDocumentSource[]>;
export type CustomFieldDocumentsResponse = ApiResponse<CustomFieldDocument[]>;
export type CustomFieldDocumentResponse = ApiResponse<CustomFieldDocument>;

export interface CreateCustomFieldDocumentRequest {
  document_id: string;
  custom_field_id: string;
  required: boolean;
  prompt: string;
  value: string;
  source: CustomFieldDocumentSource;
}

export interface UpdateCustomFieldDocumentRequest {
  required?: boolean;
  prompt?: string;
  value?: string;
  source?: CustomFieldDocumentSource;
}
