import { backendUrl } from "@/config"
import { httpClient } from "@/lib/http-client"
import type { GetWorkflowsParams, WorkflowsResponse } from "@/types/workflow"

const BASE_URL = `${backendUrl}/workflows`

export async function getWorkflows(
  organizationId: string,
  params: GetWorkflowsParams = {},
): Promise<WorkflowsResponse> {
  const { page = 1, page_size = 100, search, document_type_id } = params
  const qs = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (search?.trim()) qs.set("search", search.trim())
  if (document_type_id) qs.set("document_type_id", document_type_id)

  const response = await httpClient.get(`${BASE_URL}/?${qs}`, {
    headers: { "X-Org-Id": organizationId },
  })
  return response.json() as Promise<WorkflowsResponse>
}
