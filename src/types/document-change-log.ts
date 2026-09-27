// Log de cambios a nivel de campo de un documento (fechas, dueño, ciclo de
// vida, metadatos). Distinto del log de eventos de ciclo de vida por
// ejecución (ver execution-lifecycle.ts): este es por documento y un renglón
// por cada valor que cambió.

export type DocumentChangeType =
  | 'date_changed'
  | 'owner_changed'
  | 'lifecycle_state_changed'
  | 'metadata_changed'

// Main entity — must match backend response shape exactly.
// old_value/new_value siempre llegan como string (o null), sin importar el
// tipo real del campo subyacente — ver formatChangeValue en change-log-tab.
export interface DocumentChangeLogEntry {
  id: string
  document_id: string
  execution_id: string | null
  change_type: DocumentChangeType
  field_name: string
  old_value: string | null
  new_value: string | null
  actor_user_id: string
  comment: string | null
  created_at: string
}

// Paginated response — data es un array plano (no { events } como en
// ExecutionEventsResponse).
export interface DocumentChangeLogResponse {
  data: DocumentChangeLogEntry[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

// Query params for the change-log endpoint
export interface GetDocumentChangeLogParams {
  page?: number
  page_size?: number
  change_type?: DocumentChangeType
}
