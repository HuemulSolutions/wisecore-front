import type { ExecutionLifecycleState } from './core'

export interface UseAllExecutionsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  created_by?: string | null
  has_pending_ai_suggestion?: boolean | null
  lifecycle_state?: ExecutionLifecycleState | null
  owner_scope?: 'all' | 'me' | null
  has_unresolved_comments?: boolean | null
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
}

export interface ExecutionPollingData {
  id: string
  status: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface UseExecutionPollingProps {
  executionId: string | null
  enabled?: boolean
  pollingInterval?: number
  onStatusChange?: (status: string, execution: ExecutionPollingData) => void
}

export interface UseExecutionStateProps {
  selectedFileId?: string
  selectedOrganizationId?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documentContent?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  documentExecutions?: any[]
  selectedExecutionId: string | null
  setSelectedExecutionId: (id: string | null) => void
}
