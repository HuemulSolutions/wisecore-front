export interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  instructions?: string | null;
  asset_kind?: string | null;
  canvas_id?: string | null;
}

export interface CloneTemplateRequest {
  name?: string | null;
  include_relationships?: boolean;
}

export interface CloneTemplateResult {
  id: string;
  name: string;
  sections_copied: number;
  custom_fields_copied: number;
  docx_templates_copied: number;
  document_types_copied: number;
}

export interface TemplatesResponse {
  data: { id: string; name: string; description?: string }[];
  page: number;
  page_size: number;
  has_next: boolean;
  total?: number;
  transaction_id: string;
  timestamp: string;
}

export interface ChildDocumentExecution {
  id: string;
  name: string;
  version: string | null;
}

export interface ChildDocument {
  id: string;
  name: string;
  description: string;
  internal_code: string | null;
  asset_kind: string | null;
  access_level: string;
  folder_id: string;
  document_type_id: string;
  created_at: string;
  updated_at: string;
  executions: ChildDocumentExecution[];
}

export interface ChildDocumentFolder {
  folder_id: string;
  folder_name: string;
  documents: ChildDocument[];
}

export interface ChildDocumentsResponse {
  data: ChildDocumentFolder[];
  transaction_id: string;
  page: number;
  page_size: number;
  has_next: boolean;
  timestamp: string;
}
