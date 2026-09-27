// Tipo de dato asociado a cada question_type (incluye null para custom_field)
export type QuestionDataType =
  | "string"
  | "int"
  | "decimal"
  | "bool"
  | "date"
  | "time"
  | "image"
  | null;

export interface QuestionType {
  question_type: string;
  data_type: QuestionDataType;
}

export interface QuestionTypesResponse {
  data: QuestionType[];
  transaction_id: string;
  page: number | null;
  page_size: number | null;
  has_next: boolean | null;
  timestamp: string;
}
