export type ExecutionEventType = 'auto_advanced' | 'advanced' | 'step_completed' | 'rejected'
export type LifecycleStepKind = 'edit' | 'review' | 'approve'

/**
 * Step actual del lifecycle, tal como lo proyectan `GET /workflows/`
 * (`WorkflowItem.current_lifecycle_step`) y ahora también `GET /execution/` /
 * `GET /execution/{id}` (`Execution.current_lifecycle_step`) — mismo shape,
 * reusado en vez de declararlo dos veces (ver `types/workflow.ts`).
 */
export interface LifecycleStepSummary {
  step_id: string
  step_type: LifecycleStepKind
  /** Null si el step no tiene nombre configurado (el backend arma un respaldo tipo "Edit - 2"). */
  step_name: string | null
}

// Main entity — must match backend response shape exactly
export interface ExecutionEvent {
  id: string
  execution_id: string
  event_type: ExecutionEventType
  actor_user_id: string | null
  comment: string | null
  from_state: string | null
  to_state: string | null
  lifecycle_step_id: string | null
  step_name: string | null
  step_type: LifecycleStepKind | null
  step_order: number | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Paginated response — the event list lives under data.events
export interface ExecutionEventsResponse {
  data: {
    execution_id: string
    total: number
    events: ExecutionEvent[]
  }
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

// Query params for the events list endpoint
export interface GetExecutionEventsParams {
  page?: number
  page_size?: number
}
