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
  value_list: string[] | null;
  options?: CustomFieldOption[];
  selected_option?: CustomFieldOption | null;
  selected_options?: CustomFieldOption[] | null;
  source: CustomFieldDocumentSource;
  /** true si el campo fue copiado desde un custom field del template al crear el documento. */
  from_template: boolean;
  /** Id del custom field del template de origen; null si el campo se agregó directo en el asset. */
  custom_field_template_id: string | null;
  created_at: string;
  updated_at: string;
  data_type: string;
  question_type?: string;
  min_value?: number | null;
  max_value?: number | null;
}

export interface CustomFieldDocumentListParams extends PaginationParams {
  document_id?: string | null;
  search?: string;
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
  value: string | number | boolean | string[];
  source: CustomFieldDocumentSource;
}

export interface UpdateCustomFieldDocumentRequest {
  required?: boolean;
  prompt?: string;
  value?: string | number | boolean | string[];
  source?: CustomFieldDocumentSource;
}
