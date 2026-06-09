export type SubscriptionReactionType = 'watch' | 'love' | 'insights' | 'favorite'

// Main entity — must match backend response shape exactly
export interface Subscription {
  id: string
  document_id: string | null
  execution_id: string | null
  event_type: string | null
  reaction_type: SubscriptionReactionType
  comment: string | null
  days_before: number
  notify_email: boolean
  notify_in_app: boolean
  require_read_ack: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

// Paginated list response
export interface SubscriptionsResponse {
  data: Subscription[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  total?: number
}

// Single-item response wrapper
export interface SubscriptionResponse {
  data: Subscription
  transaction_id: string
}

// Query params for list endpoint
export interface GetSubscriptionsParams {
  page?: number
  page_size?: number
  document_id?: string
  execution_id?: string
  event_type?: string
  reaction_type?: string
}

// Request body for create
export interface CreateSubscriptionRequest {
  document_id?: string
  execution_id?: string
  event_type?: string
  reaction_type: SubscriptionReactionType
  comment?: string
  days_before?: number
  notify_email?: boolean
  notify_in_app?: boolean
  require_read_ack?: boolean
}

// Request body for update
export interface UpdateSubscriptionRequest {
  comment?: string
  days_before?: number
  notify_email?: boolean
  notify_in_app?: boolean
  require_read_ack?: boolean
}
