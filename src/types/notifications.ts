// Main entity — must match backend response shape exactly
export interface Notification {
  id: string
  document_id: string | null
  execution_id: string | null
  subscription_id: string | null
  event_type: string | null
  message: string | null
  reason: string | null
  payload: Record<string, unknown> | null
  notify_email: boolean
  notify_in_app: boolean
  require_read_ack: boolean
  is_read: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

// Paginated list response
export interface NotificationsResponse {
  data: Notification[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  total?: number
}

// Single-item response wrapper
export interface NotificationResponse {
  data: Notification
  transaction_id: string
}

// Query params for list endpoint
export interface GetNotificationsParams {
  page?: number
  page_size?: number
  is_read?: boolean
  document_id?: string
  execution_id?: string
  event_type?: string
}

// Request body for create
export interface CreateNotificationRequest {
  document_id?: string
  execution_id?: string
  subscription_id?: string
  event_type?: string
  message?: string
  reason?: string
  payload?: Record<string, unknown>
  notify_email?: boolean
  notify_in_app?: boolean
  require_read_ack?: boolean
}
