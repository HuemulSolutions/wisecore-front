export type ExecutionStatus = 'completed' | 'failed' | 'running' | 'pending' | 'queued'
export type ExecutionLifecycleState = 'draft' | 'in_review' | 'in_approval' | 'approved' | 'published' | 'archived'

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
}

export interface ExecutionsResponse {
  data: Execution[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp?: string
}

export interface GetExecutionsParams {
  page?: number
  page_size?: number
  search?: string
  has_pending_ai_suggestion?: boolean | null
  lifecycle_state?: ExecutionLifecycleState | null
  owner_scope?: 'all' | 'me' | null
  has_unresolved_comments?: boolean | null
}
