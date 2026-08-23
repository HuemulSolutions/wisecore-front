export interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  instructions?: string | null;
  asset_kind?: string | null;
  canvas_id?: string | null;
  /** Habilita view/edit propio por sección y etapa del ciclo de vida (default false). */
  section_lifecycle_access_enabled?: boolean;
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
  // Contexto y dependencias de nivel template (ver ia context/ del cambio de
  // backend). Es una copia one-shot, sin sincronización posterior — no se
  // muestran en la UI del clone hoy, igual que el resto de estos contadores.
  contexts_copied: number;
  dependencies_copied: number;
}

export interface TemplatesResponse {
  data: {
    id: string;
    name: string;
    description?: string;
    can_create_express?: boolean;
    // Presentes solo cuando el listado se filtra por mostrar_en_workflow=true.
    document_type_id?: string;
    document_type_name?: string;
    document_type_color?: string;
    require_name_on_express?: boolean;
    name_placeholder?: string | null;
    relation_name?: string | null;
  }[];
  page: number;
  page_size: number;
  has_next: boolean;
  total?: number;
  transaction_id: string;
  timestamp: string;
}

// Item de TemplatesResponse.data con los campos que requiere el listado de
// "workflows disponibles" (mostrar_en_workflow=true). document_type_id es
// obligatorio ahi: sin el no se puede llamar al endpoint express.
export interface WorkflowTemplateItem {
  id: string;
  name: string;
  description?: string;
  can_create_express?: boolean;
  document_type_id: string;
  document_type_name?: string;
  document_type_color?: string;
  require_name_on_express?: boolean;
  name_placeholder?: string | null;
  relation_name?: string | null;
}

// Filtros opcionales para GET /templates/
export interface GetTemplatesFilters {
  document_type_id?: string | null;
  can_create_express?: boolean | null;
  mostrar_en_workflow?: boolean | null;
  tag_id?: string | null;
}

// POST /document_types/{document_type_id}/templates/{template_id}/express
export interface CreateExpressBody {
  name: string;
  description?: string;
}

export interface CreateExpressResult {
  id: string;
  name: string;
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

// ========================================
// Export / Import (migración por JSON)
// ========================================

export interface ExportTemplatesBody {
  template_ids: string[];
}

export interface ImportTemplatesQueryParams {
  on_conflict?: 'skip' | 'overwrite';
  template_ids?: string[];
}

export interface ImportTemplatesData {
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

export interface ImportTemplatesResponse {
  transaction_id: string;
  timestamp: string;
  data: ImportTemplatesData;
}
