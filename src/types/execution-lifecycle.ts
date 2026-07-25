export type ExecutionEventType = 'auto_advanced' | 'advanced' | 'step_completed' | 'rejected'
export type LifecycleStepKind = 'edit' | 'review' | 'approve'

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
