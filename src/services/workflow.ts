import { backendUrl } from "@/config"
import { httpClient } from "@/lib/http-client"
import { toDateParam } from "@/lib/date-params"
import type { GetWorkflowsParams, WorkflowsResponse } from "@/types/workflow"

const BASE_URL = `${backendUrl}/workflows`

export async function getWorkflows(
  organizationId: string,
  params: GetWorkflowsParams = {},
): Promise<WorkflowsResponse> {
  const {
    page = 1,
    page_size = 100,
    search,
    document_type_id,
    created_by,
    owner_scope,
    lifecycle_state,
    has_pending_ai_suggestion,
    has_unresolved_comments,
    expiring_soon,
    template_id,
    custom_field_filter,
    expiration_date,
    expiration_date_from,
    expiration_date_to,
    estimated_publication_date,
    estimated_publication_date_from,
    estimated_publication_date_to,
    review_date,
    review_date_from,
    review_date_to,
    audit_date,
    audit_date_from,
    audit_date_to,
  } = params
  const qs = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (search?.trim()) qs.set("search", search.trim())
  if (document_type_id) qs.set("document_type_id", document_type_id)
  if (created_by) qs.set("created_by", created_by)
  if (owner_scope) qs.set("owner_scope", owner_scope)
  if (lifecycle_state) qs.set("lifecycle_state", lifecycle_state)
  if (has_pending_ai_suggestion != null) qs.set("has_pending_ai_suggestion", has_pending_ai_suggestion.toString())
  if (has_unresolved_comments != null) qs.set("has_unresolved_comments", has_unresolved_comments.toString())
  if (expiring_soon != null) qs.set("expiring_soon", expiring_soon.toString())
  if (template_id) qs.set("template_id", template_id)
  if (expiration_date) qs.set("expiration_date", toDateParam(expiration_date))
  if (expiration_date_from) qs.set("expiration_date_from", toDateParam(expiration_date_from))
  if (expiration_date_to) qs.set("expiration_date_to", toDateParam(expiration_date_to))
  if (estimated_publication_date) qs.set("estimated_publication_date", toDateParam(estimated_publication_date))
  if (estimated_publication_date_from) qs.set("estimated_publication_date_from", toDateParam(estimated_publication_date_from))
  if (estimated_publication_date_to) qs.set("estimated_publication_date_to", toDateParam(estimated_publication_date_to))
  if (review_date) qs.set("review_date", toDateParam(review_date))
  if (review_date_from) qs.set("review_date_from", toDateParam(review_date_from))
  if (review_date_to) qs.set("review_date_to", toDateParam(review_date_to))
  if (audit_date) qs.set("audit_date", toDateParam(audit_date))
  if (audit_date_from) qs.set("audit_date_from", toDateParam(audit_date_from))
  if (audit_date_to) qs.set("audit_date_to", toDateParam(audit_date_to))
  custom_field_filter?.forEach((f) => qs.append("custom_field_filter", f))

  const response = await httpClient.get(`${BASE_URL}/?${qs}`, {
    headers: { "X-Org-Id": organizationId },
  })
  return response.json() as Promise<WorkflowsResponse>
}
