import type { FormFieldConfig } from '@/types/sections/core';

export type CustomFieldDataType =
  | "string"
  | "int"
  | "date"
  | "time"
  | "datetime"
  | "decimal"
  | "bool"
  | "image"
  | "url"
  | "list";

export interface CustomFieldOption {
  id: string;
  label: string;
}

export interface CustomFieldQuestionType {
  question_type: string;
  data_type: CustomFieldDataType;
}

export interface CustomField {
  id: string;
  data_type: CustomFieldDataType;
  created_at: string;
  created_by: string | null;
  masc: string;
  name: string;
  description: string;
  updated_at: string;
  updated_by: string | null;
  question_type: string;
  required: boolean;
  order: number;
  default_value: CustomFieldOption[] | FormFieldConfig | null;
  min_value: unknown | null;
  max_value: unknown | null;
  options?: CustomFieldOption[];
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface CustomFieldsResponse {
  data: CustomField[];
  transaction_id: string;
  page: number;
  page_size: number;
  has_next: boolean;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  transaction_id: string;
  timestamp: string;
}

// Archivo de la colección value_blobs de un custom field value (carga_de_archivos con
// max_value > 1) — independiente del legado media_id/value/value_identifier poblado por
// el endpoint value_blob singular. Ver ia context/multiples-archivos-en-custom-fields.md.
export interface CustomFieldValueFile {
  id: string;
  media_id: string;
  name: string;
  content_type: string;
  size: number;
  download_url: string;
  created_at: string;
}

export type CustomFieldValueFilesResponse = ApiResponse<CustomFieldValueFile[]>;
export type CustomFieldValueFileResponse = ApiResponse<CustomFieldValueFile>;

// Distingue entre custom_field_templates y custom_field_documents — mismos endpoints,
// distinto recurso base.
export type CustomFieldValueEntityType = "template" | "document";

export interface CreateCustomFieldRequest {
  name: string;
  description: string;
  masc: string;
  question_type: string;
  required?: boolean;
  order?: number;
  default_value?: CustomFieldOption[] | FormFieldConfig | null;
  min_value?: unknown | null;
  max_value?: unknown | null;
}

export interface UpdateCustomFieldRequest {
  name?: string;
  description?: string;
  masc?: string;
  question_type?: string;
  required?: boolean;
  order?: number;
  default_value?: CustomFieldOption[] | FormFieldConfig | null;
  min_value?: unknown | null;
  max_value?: unknown | null;
}
