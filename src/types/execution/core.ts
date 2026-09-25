import type { LifecycleStepSummary } from '@/types/execution-lifecycle'
import type { LifecyclePermissions } from '@/types/assets'

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
  /** Timestamp de entrada al `lifecycle_state` actual (se resetea en cada transición advance/reject). Backfill impreciso para ejecuciones viejas (se rellenó con `updated_at` al migrar), exacto de acá en adelante. */
  lifecycle_state_since?: string | null
  /** Paso del ciclo de vida vigente para el estado actual. Null cuando no hay `document_type_id` o el estado no tiene steps configurables (ej. published, archived). Mismo shape que `WorkflowItem.current_lifecycle_step`. */
  current_lifecycle_step?: LifecycleStepSummary | null
  /** Mismo shape que `AssetContentResponse.data.lifecycle_permissions` — el front deriva los botones con `resolveLifecycleActionsVisibility`, no con una lista de acciones ya resuelta (decisión de backend, ver respuestas/spec-home-mi-trabajo-backend.md §4). Sin `lifecycle_status` (can_advance/can_rollback/advance_blockers) todavía no alcanza para pintar botones inline por fila. */
  lifecycle_permissions?: LifecyclePermissions
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
  /** Conteo exacto de filas que matchean los filtros, antes de paginar. `null` cuando se envía `query` (el buscador semántico/keyword no calcula un total exacto barato) — no leer ese `null` como `0`. */
  total?: number | null
  timestamp?: string
}

export type ExecutionSearchType = 'semantic' | 'title' | 'code' | 'content'

/** Alcance de "asignado a mí": autorizado a actuar en el step de lifecycle correspondiente al estado actual (review→in_review, approve→in_approval). No combinable con `query` (400 PENDING_MY_ACTION_WITH_SEARCH_NOT_SUPPORTED). */
export type ExecutionPendingMyAction = 'review' | 'approve' | 'any'

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
  /** No combinable con `query`/`search_type` — ver `ExecutionPendingMyAction`. */
  pending_my_action?: ExecutionPendingMyAction | null
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
