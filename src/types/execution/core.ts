// El backend emite más valores que los que este tipo declaraba originalmente
// (solo 5); el polling de ejecución y de aprobación maneja al menos estos.
// Ver src/lib/execution-status.ts para los sets de terminales de éxito/fallo.
export type ExecutionStatus =
  | 'queued'
  | 'pending'
  | 'running'
  | 'generating'
  | 'paused'
  | 'importing'
  | 'approving'
  | 'completed'
  | 'done'
  | 'approved'
  | 'failed'
  | 'cancelled'
  | 'import_failed'
export type ExecutionLifecycleState = 'draft' | 'in_review' | 'in_approval' | 'approved' | 'published' | 'archived' | 'finalized'

/**
 * Sección tal como llega en `sections[]` de `GET /execution/{id}` — ya filtrada
 * por `view` para el usuario actual (las secciones sin acceso simplemente no
 * aparecen, sin huecos en la numeración). Ver
 * "ia context/permisos-seccion-lifecycle-guide.md".
 */
export interface ExecutionSection {
  id: string
  template_section_id: string
  section_execution_id: string
  name: string
  prompt: string
  output: string
  is_orphaned: boolean
  /** Ausente/`null` si el permiso por sección no aplica — depende solo del permiso de documento completo. */
  can_edit?: boolean | null
}

export interface Execution {
  id: string
  name: string
  document_id: string
  document_name: string
  status: ExecutionStatus
  lifecycle_state: ExecutionLifecycleState
  status_message: string | null
  user_instruction: string | null
  input_tokens: number
  output_tokens: number
  total_tokens: number
  version_major: number | null
  version_minor: number | null
  version_patch: number | null
  model_id: string | null
  expiration_date: string | null
  estimated_publication_date: string | null
  review_date: string | null
  audit_date: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  created_by_user_name: string | null
  updated_by_user_name: string | null
  has_pending_ai_suggestion: boolean
  task_status: string | null
  has_unresolved_comments: boolean
  unresolved_comments_count: number
  change_summary_status: 'pending' | 'completed' | 'failed' | null
  change_summary: string | null
  change_summary_error: string | null
  previous_execution_id: string | null
  summary_status: 'pending' | 'completed' | 'failed' | null
  summary: string | null
  summary_error: string | null
  /** Solo presente en la respuesta de `GET /execution/{id}` (detalle completo). */
  sections?: ExecutionSection[]
}

export interface ExecutionsResponse {
  data: Execution[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp?: string
}

export type ExecutionSearchType = 'semantic' | 'title' | 'code' | 'content'

export interface GetExecutionsParams {
  page?: number
  page_size?: number
  query?: string
  search_type?: ExecutionSearchType
  created_by?: string | null
  has_pending_ai_suggestion?: boolean | null
  lifecycle_state?: ExecutionLifecycleState | null
  owner_scope?: 'all' | 'me' | null
  has_unresolved_comments?: boolean | null
  expiring_soon?: boolean | null
  expiration_date?: string | null
  expiration_date_from?: string | null
  expiration_date_to?: string | null
  estimated_publication_date?: string | null
  estimated_publication_date_from?: string | null
  estimated_publication_date_to?: string | null
  review_date?: string | null
  review_date_from?: string | null
  review_date_to?: string | null
  audit_date?: string | null
  audit_date_from?: string | null
  audit_date_to?: string | null
  template_id?: string | null
  document_type_id?: string | null
  sort?: string | null
  custom_field_filter?: string[]
}

export interface RollbackTarget {
  id: string;
  value: string;
  display_name: string;
}

export interface RollbackStep {
  step_id: string;
  name: string;
  type: string;
  order: number;
  lifecycle_state: string;
}

export interface RollbackTargetsResponse {
  execution_id: string;
  current_state: string;
  states: RollbackTarget[];
  steps: RollbackStep[];
}

export interface ExecutionVersionSuggestion {
  major: number
  minor: number
  patch: number
  based_on: string | null
}

export interface ExecutionVersionSuggestionResponse {
  data: ExecutionVersionSuggestion
  transaction_id: string
}
