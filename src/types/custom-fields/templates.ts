import type { PaginationParams, ApiResponse, CustomFieldOption } from './core'

export type CustomFieldTemplateSource = "manual" | "inferred";

export interface CustomFieldTemplate {
  id: string;
  template_id: string;
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
  source: CustomFieldTemplateSource;
  created_at: string;
  updated_at: string;
  data_type: string;
  question_type?: string;
}

export interface CustomFieldTemplateListParams extends PaginationParams {
  template_id?: string | null;
}

export interface CustomFieldTemplateByTemplateParams extends PaginationParams {
  template_id: string;
}

export type CustomFieldTemplateSourcesResponse = ApiResponse<CustomFieldTemplateSource[]>;
export interface CustomFieldTemplatesResponse extends ApiResponse<CustomFieldTemplate[]> {
  page: number;
  page_size: number;
  has_next: boolean;
}
export type CustomFieldTemplateResponse = ApiResponse<CustomFieldTemplate>;

export interface CreateCustomFieldTemplateRequest {
  template_id: string;
  custom_field_id: string;
  required: boolean;
  prompt: string;
  value: string | number | boolean | string[];
  source: CustomFieldTemplateSource;
}

export interface UpdateCustomFieldTemplateRequest {
  template_id?: string;
  custom_field_id?: string;
  required?: boolean;
  prompt?: string;
  value?: string | number | boolean | string[];
  source?: CustomFieldTemplateSource;
}
