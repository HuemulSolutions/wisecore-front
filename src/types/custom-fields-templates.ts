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
  source: CustomFieldTemplateSource;
  created_at: string;
  updated_at: string;
  data_type: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface CustomFieldTemplateListParams extends PaginationParams {
  template_id?: string | null;
}

export interface CustomFieldTemplateByTemplateParams extends PaginationParams {
  template_id: string;
}

export interface ApiResponse<T> {
  data: T;
  transaction_id: string;
  timestamp: string;
}

// Type aliases for API responses extending the base ApiResponse
export type CustomFieldTemplateSourcesResponse = ApiResponse<CustomFieldTemplateSource[]>;
export interface CustomFieldTemplatesResponse extends ApiResponse<CustomFieldTemplate[]> {
  page: number;
  page_size: number;
  has_next: boolean;
}
export type CustomFieldTemplateResponse = ApiResponse<CustomFieldTemplate>;

// Request types for creating and updating custom field templates
export interface CreateCustomFieldTemplateRequest {
  template_id: string;
  custom_field_id: string;
  required: boolean;
  prompt: string;
  value: string;
  source: CustomFieldTemplateSource;
}

export interface UpdateCustomFieldTemplateRequest {
  template_id?: string;
  custom_field_id?: string;
  required?: boolean;
  prompt?: string;
  value?: string;
  source?: CustomFieldTemplateSource;
}