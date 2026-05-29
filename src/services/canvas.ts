import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  Canvas,
  CanvasResponse,
  CanvasListResponse,
  GetCanvasListParams,
  CreateCanvasRequest,
  UpdateCanvasRequest,
} from '@/types/canvas'

const BASE_URL = `${backendUrl}/canvas`

export async function getCanvasList(
  organizationId: string,
  params: GetCanvasListParams = {},
): Promise<CanvasListResponse> {
  const { page = 1, page_size = 100, search, is_active } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (search?.trim()) query.set('search', search.trim())
  if (is_active !== undefined) query.set('is_active', is_active.toString())

  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<CanvasListResponse>
}

export async function getCanvas(
  organizationId: string,
  canvasId: string,
): Promise<Canvas> {
  const response = await httpClient.get(`${BASE_URL}/${canvasId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as CanvasResponse
  return data.data
}

export async function createCanvas(
  organizationId: string,
  body: CreateCanvasRequest,
): Promise<Canvas> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as CanvasResponse
  return data.data
}

export async function updateCanvas(
  organizationId: string,
  canvasId: string,
  body: UpdateCanvasRequest,
): Promise<Canvas> {
  const response = await httpClient.put(`${BASE_URL}/${canvasId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as CanvasResponse
  return data.data
}

export async function deleteCanvas(
  organizationId: string,
  canvasId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${canvasId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { Canvas, CanvasListResponse }
