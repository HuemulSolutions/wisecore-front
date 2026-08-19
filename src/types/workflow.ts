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

/**
 * Subconjunto de WorkflowItem que WorkflowDetailPanel necesita para su prop
 * `row`. Permite renderizar el wizard fuera de la tabla (vista compartida a
 * pantalla completa, ver workflow-fill.tsx) con solo los IDs de la URL —
 * document_name/internal_code quedan opcionales para que el panel caiga a
 * los que trae `GET /documents/{id}/content` en vez de mostrar un string
 * vacío. WorkflowItem lo satisface tal cual.
 */
export type WorkflowRowRef = Pick<WorkflowItem, "document_id" | "execution_id"> &
  Partial<Pick<WorkflowItem, "document_name" | "internal_code">>

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
  created_by?: string | null
  owner_scope?: "me" | null
  lifecycle_state?: ExecutionLifecycleState | null
  has_pending_ai_suggestion?: boolean | null
  has_unresolved_comments?: boolean | null
  expiring_soon?: boolean | null
  template_id?: string | null
  custom_field_filter?: string[]
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
}

export interface UseWorkflowsOptions extends Omit<GetWorkflowsParams, "page_size"> {
  enabled?: boolean
  pageSize?: number
}
