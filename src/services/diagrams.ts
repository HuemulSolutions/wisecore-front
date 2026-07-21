import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  Diagram,
  DiagramResponse,
  DiagramsResponse,
  GetDiagramsParams,
  CreateDiagramRequest,
  UpdateDiagramRequest,
} from '@/types/diagrams'

const BASE_URL = `${backendUrl}/diagrams`

export async function getDiagrams(
  organizationId: string,
  params: GetDiagramsParams = {},
): Promise<DiagramsResponse> {
  const { page = 1, page_size = 100, search, execution_id } = params
  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (search?.trim()) query.set('search', search.trim())
  if (execution_id) query.set('execution_id', execution_id)
  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<DiagramsResponse>
}

export async function getDiagram(
  organizationId: string,
  diagramId: string,
): Promise<Diagram> {
  const response = await httpClient.get(`${BASE_URL}/${diagramId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DiagramResponse
  return data.data
}

export async function createDiagram(
  organizationId: string,
  body: CreateDiagramRequest,
): Promise<Diagram> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DiagramResponse
  return data.data
}

export async function updateDiagram(
  organizationId: string,
  diagramId: string,
  body: UpdateDiagramRequest,
): Promise<Diagram> {
  const response = await httpClient.put(`${BASE_URL}/${diagramId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DiagramResponse
  return data.data
}

export async function deleteDiagram(
  organizationId: string,
  diagramId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${diagramId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { Diagram, DiagramsResponse }
