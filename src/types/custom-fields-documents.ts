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
  source: CustomFieldDocumentSource;
  created_at: string;
  updated_at: string;
  data_type: string;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface CustomFieldDocumentListParams extends PaginationParams {
  document_id?: string | null;
}

export interface CustomFieldDocumentByDocumentParams extends PaginationParams {
  document_id: string;
}

export interface ApiResponse<T> {
  data: T;
  transaction_id: string;
  timestamp: string;
}

// Type aliases for API responses extending the base ApiResponse
export type CustomFieldDocumentSourcesResponse = ApiResponse<CustomFieldDocumentSource[]>;
export type CustomFieldDocumentsResponse = ApiResponse<CustomFieldDocument[]>;
export type CustomFieldDocumentResponse = ApiResponse<CustomFieldDocument>;

// Request types for creating and updating custom field documents
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