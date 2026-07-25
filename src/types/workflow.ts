import type { ExecutionLifecycleState } from "@/types/execution"

export type { ExecutionLifecycleState }

export interface WorkflowCurrentStep {
  section_execution_id: string
  section_name: string
}

export interface WorkflowItem {
  document_id: string
  execution_id: string
  internal_code: string
  document_name: string
  template_name: string
  lifecycle_state: ExecutionLifecycleState
  progress_percentage: number
  current_step: WorkflowCurrentStep | null
  last_modified_at: string
}

export interface WorkflowsResponse {
  data: WorkflowItem[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
}

export interface GetWorkflowsParams {
  page?: number
  page_size?: number
  search?: string
  document_type_id?: string | null
}

export interface UseWorkflowsOptions extends Omit<GetWorkflowsParams, "page_size"> {
  enabled?: boolean
  pageSize?: number
}
