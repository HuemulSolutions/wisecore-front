import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  TokenUsage,
  TokenUsageResponse,
  TokenUsageListResponse,
  TokenUsageStats,
  TokenUsageStatsResponse,
  GetTokenUsageListParams,
  GetTokenUsageStatsParams,
} from '@/types/token-usage'

const BASE_URL = `${backendUrl}/token-usage`

function buildParams(filters: Record<string, string | number | undefined>): URLSearchParams {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue
    if (typeof value === 'string' && !value.trim()) continue
    query.set(key, String(value))
  }
  return query
}

export async function getTokenUsageStats(
  organizationId: string,
  params: GetTokenUsageStatsParams = {},
): Promise<TokenUsageStats> {
  const query = buildParams(params)
  const response = await httpClient.get(`${BASE_URL}/stats?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as TokenUsageStatsResponse
  return data.data
}

export async function getTokenUsageList(
  organizationId: string,
  params: GetTokenUsageListParams = {},
): Promise<TokenUsageListResponse> {
  const { page = 1, page_size = 20, ...filters } = params
  const query = buildParams({ page, page_size, ...filters })
  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<TokenUsageListResponse>
}

export async function getTokenUsage(
  organizationId: string,
  usageId: string,
): Promise<TokenUsage> {
  const response = await httpClient.get(`${BASE_URL}/${usageId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as TokenUsageResponse
  return data.data
}

export type { TokenUsage, TokenUsageStats, TokenUsageListResponse }
