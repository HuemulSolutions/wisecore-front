import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  ExternalFunctionality,
  ExternalFunctionalityResponse,
  ExternalFunctionalitiesResponse,
  GetExternalFunctionalitiesParams,
  CreateExternalFunctionalityRequest,
  UpdateExternalFunctionalityRequest,
} from '@/types/external-functionalities'
import type {
  ExternalExecutionLogsFilters,
  ExternalExecutionLogsResponse,
} from '@/types/external-systems'

const BASE_URL = `${backendUrl}/external-systems`

export async function getExternalFunctionalities(
  organizationId: string,
  systemId: string,
  params: GetExternalFunctionalitiesParams = {},
): Promise<ExternalFunctionalitiesResponse> {
  const {
    page = 1,
    page_size = 50,
    search,
    http_method,
    execution_type,
    functionality_class,
    objective,
  } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })

  if (search?.trim()) query.set('search', search.trim())
  if (http_method) query.set('http_method', http_method)
  if (execution_type) query.set('execution_type', execution_type)
  if (functionality_class) query.set('functionality_class', functionality_class)
  if (objective) query.set('objective', objective)

  const response = await httpClient.get(`${BASE_URL}/${systemId}/functionalities/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })

  return response.json() as Promise<ExternalFunctionalitiesResponse>
}

export async function getExternalFunctionality(
  organizationId: string,
  systemId: string,
  functionalityId: string,
): Promise<ExternalFunctionality> {
  const response = await httpClient.get(
    `${BASE_URL}/${systemId}/functionalities/${functionalityId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalFunctionalityResponse
  return data.data
}

export async function createExternalFunctionality(
  organizationId: string,
  systemId: string,
  body: CreateExternalFunctionalityRequest,
): Promise<ExternalFunctionality> {
  const response = await httpClient.post(
    `${BASE_URL}/${systemId}/functionalities/`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalFunctionalityResponse
  return data.data
}

export async function updateExternalFunctionality(
  organizationId: string,
  systemId: string,
  functionalityId: string,
  body: UpdateExternalFunctionalityRequest,
): Promise<ExternalFunctionality> {
  const response = await httpClient.put(
    `${BASE_URL}/${systemId}/functionalities/${functionalityId}`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalFunctionalityResponse
  return data.data
}

export async function deleteExternalFunctionality(
  organizationId: string,
  systemId: string,
  functionalityId: string,
): Promise<void> {
  await httpClient.delete(
    `${BASE_URL}/${systemId}/functionalities/${functionalityId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
}

export async function getExternalExecutionLogs(
  systemId: string,
  functionalityId: string,
  organizationId: string,
  filters: ExternalExecutionLogsFilters = {},
): Promise<ExternalExecutionLogsResponse> {
  const query = new URLSearchParams()
  if (filters.page) query.set('page', filters.page.toString())
  if (filters.page_size) query.set('page_size', filters.page_size.toString())
  if (filters.status) query.set('status', filters.status)
  if (filters.document_id) query.set('document_id', filters.document_id)
  if (filters.execution_id) query.set('execution_id', filters.execution_id)
  if (filters.publish_run_id) query.set('publish_run_id', filters.publish_run_id)
  if (filters.lifecycle_step_id) query.set('lifecycle_step_id', filters.lifecycle_step_id)
  if (filters.http_status_code) query.set('http_status_code', filters.http_status_code.toString())

  const qs = query.toString()
  const response = await httpClient.get(
    `${BASE_URL}/${systemId}/functionalities/${functionalityId}/execution-logs/${qs ? `?${qs}` : ''}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  return response.json() as Promise<ExternalExecutionLogsResponse>
}
