import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  ExternalSystem,
  ExternalSystemResponse,
  ExternalSystemsResponse,
  GetExternalSystemsParams,
  CreateExternalSystemRequest,
  UpdateExternalSystemRequest,
} from '@/types/external-systems'

const BASE_URL = `${backendUrl}/external-systems`

export async function getExternalSystems(
  organizationId: string,
  params: GetExternalSystemsParams = {},
): Promise<ExternalSystemsResponse> {
  const { page = 1, page_size = 50, search, status } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })

  if (search?.trim()) query.set('search', search.trim())
  if (status) query.set('status', status)

  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })

  return response.json() as Promise<ExternalSystemsResponse>
}

export async function getExternalSystem(
  organizationId: string,
  systemId: string,
): Promise<ExternalSystem> {
  const response = await httpClient.get(`${BASE_URL}/${systemId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as ExternalSystemResponse
  return data.data
}

export async function createExternalSystem(
  organizationId: string,
  body: CreateExternalSystemRequest,
): Promise<ExternalSystem> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as ExternalSystemResponse
  return data.data
}

export async function updateExternalSystem(
  organizationId: string,
  systemId: string,
  body: UpdateExternalSystemRequest,
): Promise<ExternalSystem> {
  const response = await httpClient.put(`${BASE_URL}/${systemId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as ExternalSystemResponse
  return data.data
}

export async function deleteExternalSystem(
  organizationId: string,
  systemId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${systemId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type {
  ExternalSystem,
  ExternalSystemsResponse,
  GetExternalSystemsParams,
  CreateExternalSystemRequest,
  UpdateExternalSystemRequest,
}

