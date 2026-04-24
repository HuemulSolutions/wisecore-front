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
