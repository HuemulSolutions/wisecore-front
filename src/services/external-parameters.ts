import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  ExternalParameter,
  ExternalParameterResponse,
  ExternalParametersResponse,
  GetExternalParametersParams,
  CreateExternalParameterRequest,
  UpdateExternalParameterRequest,
} from '@/types/external-parameters'

const BASE_URL = `${backendUrl}/external-systems`

export async function getExternalParameters(
  organizationId: string,
  systemId: string,
  params: GetExternalParametersParams = {},
): Promise<ExternalParametersResponse> {
  const { page = 1, page_size = 50, search, param_type } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })

  if (search?.trim()) query.set('search', search.trim())
  if (param_type) query.set('param_type', param_type)

  const response = await httpClient.get(
    `${BASE_URL}/${systemId}/parameters/?${query}`,
    { headers: { 'X-Org-Id': organizationId } },
  )

  return response.json() as Promise<ExternalParametersResponse>
}

export async function getExternalParameter(
  organizationId: string,
  systemId: string,
  parameterId: string,
): Promise<ExternalParameter> {
  const response = await httpClient.get(
    `${BASE_URL}/${systemId}/parameters/${parameterId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalParameterResponse
  return data.data
}

export async function createExternalParameter(
  organizationId: string,
  systemId: string,
  body: CreateExternalParameterRequest,
): Promise<ExternalParameter> {
  const response = await httpClient.post(
    `${BASE_URL}/${systemId}/parameters/`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalParameterResponse
  return data.data
}

export async function updateExternalParameter(
  organizationId: string,
  systemId: string,
  parameterId: string,
  body: UpdateExternalParameterRequest,
): Promise<ExternalParameter> {
  const response = await httpClient.put(
    `${BASE_URL}/${systemId}/parameters/${parameterId}`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalParameterResponse
  return data.data
}

export async function deleteExternalParameter(
  organizationId: string,
  systemId: string,
  parameterId: string,
): Promise<void> {
  await httpClient.delete(
    `${BASE_URL}/${systemId}/parameters/${parameterId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
}

// ─── Functionality-scoped parameters ─────────────────────────────────────────

export async function getExternalFunctionalityParameters(
  organizationId: string,
  systemId: string,
  functionalityId: string,
  params: GetExternalParametersParams = {},
): Promise<ExternalParametersResponse> {
  const { page = 1, page_size = 50, search, param_type } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })

  if (search?.trim()) query.set('search', search.trim())
  if (param_type) query.set('param_type', param_type)

  const response = await httpClient.get(
    `${BASE_URL}/${systemId}/functionalities/${functionalityId}/parameters/?${query}`,
    { headers: { 'X-Org-Id': organizationId } },
  )

  return response.json() as Promise<ExternalParametersResponse>
}

export async function getExternalFunctionalityParameter(
  organizationId: string,
  systemId: string,
  functionalityId: string,
  parameterId: string,
): Promise<ExternalParameter> {
  const response = await httpClient.get(
    `${BASE_URL}/${systemId}/functionalities/${functionalityId}/parameters/${parameterId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalParameterResponse
  return data.data
}

export async function createExternalFunctionalityParameter(
  organizationId: string,
  systemId: string,
  functionalityId: string,
  body: CreateExternalParameterRequest,
): Promise<ExternalParameter> {
  const response = await httpClient.post(
    `${BASE_URL}/${systemId}/functionalities/${functionalityId}/parameters/`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalParameterResponse
  return data.data
}

export async function updateExternalFunctionalityParameter(
  organizationId: string,
  systemId: string,
  functionalityId: string,
  parameterId: string,
  body: UpdateExternalParameterRequest,
): Promise<ExternalParameter> {
  const response = await httpClient.put(
    `${BASE_URL}/${systemId}/functionalities/${functionalityId}/parameters/${parameterId}`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalParameterResponse
  return data.data
}

export async function deleteExternalFunctionalityParameter(
  organizationId: string,
  systemId: string,
  functionalityId: string,
  parameterId: string,
): Promise<void> {
  await httpClient.delete(
    `${BASE_URL}/${systemId}/functionalities/${functionalityId}/parameters/${parameterId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
}

export type { ExternalParameter, ExternalParametersResponse }
