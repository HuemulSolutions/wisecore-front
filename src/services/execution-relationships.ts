import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  ExecutionRelationship,
  ExecutionRelationshipResponse,
  ExecutionRelationshipsResponse,
  ExecutionRelationshipsByExecutionResponse,
  GetExecutionRelationshipsParams,
  CreateExecutionRelationshipRequest,
  UpdateExecutionRelationshipRequest,
} from '@/types/execution-relationships'

const BASE_URL = `${backendUrl}/execution_relationships`

export async function getExecutionRelationshipsByExecution(
  organizationId: string,
  executionId: string,
  params: GetExecutionRelationshipsParams = {},
): Promise<ExecutionRelationshipsByExecutionResponse> {
  const { direction = 'all', page = 1, page_size = 100, include_subrelationships } = params

  const query = new URLSearchParams({
    direction,
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (include_subrelationships) query.set('include_subrelationships', 'true')

  const response = await httpClient.get(
    `${BASE_URL}/execution/${executionId}/relationships?${query}`,
    { headers: { 'X-Org-Id': organizationId } },
  )
  return response.json() as Promise<ExecutionRelationshipsByExecutionResponse>
}

export async function getExecutionRelationship(
  organizationId: string,
  executionRelationshipId: string,
): Promise<ExecutionRelationship> {
  const response = await httpClient.get(`${BASE_URL}/${executionRelationshipId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as ExecutionRelationshipResponse
  return data.data
}

export async function createExecutionRelationship(
  organizationId: string,
  body: CreateExecutionRelationshipRequest,
): Promise<ExecutionRelationship> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as ExecutionRelationshipResponse
  return data.data
}

export async function updateExecutionRelationship(
  organizationId: string,
  executionRelationshipId: string,
  body: UpdateExecutionRelationshipRequest,
): Promise<ExecutionRelationship> {
  const response = await httpClient.patch(`${BASE_URL}/${executionRelationshipId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as ExecutionRelationshipResponse
  return data.data
}

export async function deleteExecutionRelationship(
  organizationId: string,
  executionRelationshipId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${executionRelationshipId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { ExecutionRelationship, ExecutionRelationshipsResponse }
