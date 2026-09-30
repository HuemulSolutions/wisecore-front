/**
 * Búsqueda por pasajes (`GET /search/passages`, PR backend #356): fragmentos rankeados con
 * su cita, en vez de documentos agrupados. Contrato en
 * `src/modules/search/use_cases/search_passages_use_case.py` del backend.
 */

export type VersionScope = 'official' | 'latest' | 'all'
export type SearchIn = 'executions' | 'media'

export interface PassageCitation {
  document_id: string
  document_name: string
  internal_code: string | null
  document_type_id: string | null
  document_type_name: string | null
  execution_id: string
  execution_name: string | null
  version_string: string | null
  lifecycle_state: string | null
  section_execution_id: string | null
  section_id: string | null
  section_name: string
  heading_path: string[]
  /** Absoluta y sin la sección: el front arma su propio enlace. */
  url: string | null
}

export interface PassageMedia {
  media_id: string
  name: string | null
  type: string | null
  summary: string | null
}

export interface PassageRelatedAsset {
  document_id: string
  document_name: string
  internal_code: string | null
  execution_id: string | null
  version_string: string | null
  lifecycle_state: string | null
  relation: { kind: 'execution_relationship' | 'dependency'; name: string | null; direction: string }
}

export interface SearchPassage {
  passage_id: string
  rank: number
  /** 0..1, relativo al mejor pasaje de la búsqueda. */
  score: number
  source_kind: string
  text: string
  /** El pasaje con sus fragmentos vecinos: lo que conviene mostrar. */
  snippet: string
  context: string | null
  citation: PassageCitation
  media: PassageMedia[]
  related_assets: PassageRelatedAsset[]
}

export interface SearchPassagesHighPrecision {
  requested: boolean
  applied: boolean
  llm_name: string | null
  /** El rerank falló (timeout del LLM, respuesta inválida) y se usó el orden estándar. */
  error: string | null
  skipped?: string | null
}

export interface SearchPassagesResponse {
  /** `null` si el registro de la búsqueda falló: sin él no hay feedback posible. */
  search_log_id: string | null
  query: string
  version_scope: VersionScope | null
  lifecycle_states: string[] | null
  search_in: SearchIn[]
  document_type_ids?: string[]
  high_precision: SearchPassagesHighPrecision
  passages: SearchPassage[]
  timings_ms: Record<string, number>
}

export interface SearchPassagesParams {
  organizationId: string
  query: string
  topK?: number
  versionScope?: VersionScope
  lifecycleStates?: string[]
  documentTypeIds?: string[]
  templateId?: string | null
  ownerScope?: 'me'
  customFieldFilter?: string[]
  searchIn?: SearchIn[]
  highPrecision?: boolean
}

export interface SearchFeedbackRequest {
  search_log_id: string
  /** Sin `passage_id`, el feedback es sobre la búsqueda completa. */
  passage_id?: string
  useful: boolean
  comment?: string
}

/** Una búsqueda registrada (`GET /search/logs`, solo org admins). */
export interface SearchLogItem {
  id: string
  created_at: string
  user_id: string | null
  query: string
  source: 'api' | 'chatbot' | string
  version_scope: string | null
  lifecycle_states: string[] | null
  filters: Record<string, unknown> | null
  passage_ids: string[]
  scores: number[]
  result_count: number
  latency_ms: number | null
  rerank_applied: boolean
  feedback_count: number
  useful_count: number
}

export interface SearchLogFeedbackItem {
  id: string
  passage_id: string | null
  useful: boolean
  comment: string | null
  user_id: string | null
  created_at: string
}

export interface SearchLogsResponse {
  data: SearchLogItem[]
  page: number
  page_size: number
  has_next: boolean
}
