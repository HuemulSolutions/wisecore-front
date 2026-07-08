export interface ExternalExecutionLog {
  id: string
  external_functionality_id: string
  publish_run_id: string
  lifecycle_step_id: string
  lifecycle_external_publish_action_id: string
  job_id: string
  execution_order: number
  document_id: string
  execution_id: string
  resolved_url: string
  resolved_params: Record<string, unknown>
  resolved_body: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  http_status_code: number | null
  response_body: string | null
  error_detail: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface ExternalExecutionLogsResponse {
  data: ExternalExecutionLog[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  timestamp: string
}

export interface ExternalExecutionLogsFilters {
  page?: number
  page_size?: number
  status?: string
  document_id?: string
  execution_id?: string
  publish_run_id?: string
  lifecycle_step_id?: string
  http_status_code?: number
}
