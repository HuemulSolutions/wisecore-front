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
