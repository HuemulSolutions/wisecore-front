import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  ExternalSecret,
  ExternalSecretResponse,
  ExternalSecretsResponse,
  GetExternalSecretsParams,
  CreateExternalSecretRequest,
  UpdateExternalSecretRequest,
} from '@/types/external-secrets'

const BASE_URL = `${backendUrl}/external-systems`

export async function getExternalSecrets(
  organizationId: string,
  systemId: string,
  params: GetExternalSecretsParams = {},
): Promise<ExternalSecretsResponse> {
  const { page = 1, page_size = 50, search } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (search?.trim()) query.set('search', search.trim())

  const response = await httpClient.get(
    `${BASE_URL}/${systemId}/secrets/?${query}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  return response.json() as Promise<ExternalSecretsResponse>
}

export async function getExternalSecret(
  organizationId: string,
  systemId: string,
  secretId: string,
): Promise<ExternalSecret> {
  const response = await httpClient.get(
    `${BASE_URL}/${systemId}/secrets/${secretId}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalSecretResponse
  return data.data
}

export async function createExternalSecret(
  organizationId: string,
  systemId: string,
  body: CreateExternalSecretRequest,
): Promise<ExternalSecret> {
  const response = await httpClient.post(
    `${BASE_URL}/${systemId}/secrets/`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalSecretResponse
  return data.data
}

export async function updateExternalSecret(
  organizationId: string,
  systemId: string,
  secretId: string,
  body: UpdateExternalSecretRequest,
): Promise<ExternalSecret> {
  const response = await httpClient.put(
    `${BASE_URL}/${systemId}/secrets/${secretId}`,
    body,
    { headers: { 'X-Org-Id': organizationId } },
  )
  const data = (await response.json()) as ExternalSecretResponse
  return data.data
}

export async function deleteExternalSecret(
  organizationId: string,
  systemId: string,
  secretId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${systemId}/secrets/${secretId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { ExternalSecret, ExternalSecretsResponse }
