import { useQuery } from '@tanstack/react-query'
import {
  getTokenUsage,
  getTokenUsageSummary,
  getTokenUsageByUser,
} from '@/services/token-usage'
import type {
  GetTokenUsageStatsParams,
  GetTokenUsageSummaryParams,
  GetTokenUsageByUserParams,
} from '@/types/token-usage'

export const tokenUsageQueryKeys = {
  all: ['token-usage'] as const,
  // `list` (GET /token-usage/) se eliminó junto con useTokenUsageList: sin
  // consumidores tras esta auditoría. `listBase` queda para invalidación
  // amplia por prefijo si el endpoint se consume en el futuro.
  listBase: () => [...tokenUsageQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, usageId: string) =>
    [...tokenUsageQueryKeys.all, 'detail', organizationId, usageId] as const,
  statsBase: () => [...tokenUsageQueryKeys.all, 'stats'] as const,
  stats: (organizationId: string, params: GetTokenUsageStatsParams) =>
    [...tokenUsageQueryKeys.statsBase(), organizationId, params] as const,
  summaryBase: () => [...tokenUsageQueryKeys.all, 'summary'] as const,
  summary: (organizationId: string, params: GetTokenUsageSummaryParams) =>
    [...tokenUsageQueryKeys.summaryBase(), organizationId, params] as const,
  byUserBase: () => [...tokenUsageQueryKeys.all, 'by-user'] as const,
  byUser: (organizationId: string, params: GetTokenUsageByUserParams) =>
    [...tokenUsageQueryKeys.byUserBase(), organizationId, params] as const,
}

export function useTokenUsage(organizationId: string, usageId: string) {
  return useQuery({
    queryKey: tokenUsageQueryKeys.detail(organizationId, usageId),
    queryFn: () => getTokenUsage(organizationId, usageId),
    enabled: !!organizationId && !!usageId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

export interface UseTokenUsageSummaryOptions extends GetTokenUsageSummaryParams {
  enabled?: boolean
}

export function useTokenUsageSummary(organizationId: string, options: UseTokenUsageSummaryOptions = {}) {
  const { enabled = true, ...params } = options

  return useQuery({
    queryKey: tokenUsageQueryKeys.summary(organizationId, params),
    queryFn: () => getTokenUsageSummary(organizationId, params),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

export interface UseTokenUsageByUserOptions extends GetTokenUsageByUserParams {
  enabled?: boolean
}

export function useTokenUsageByUser(organizationId: string, options: UseTokenUsageByUserOptions = {}) {
  const { enabled = true, ...params } = options

  return useQuery({
    queryKey: tokenUsageQueryKeys.byUser(organizationId, params),
    queryFn: () => getTokenUsageByUser(organizationId, params),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}
