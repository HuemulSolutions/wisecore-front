import { useQuery } from '@tanstack/react-query'
import { getTokenUsageStats, getTokenUsageList, getTokenUsage } from '@/services/token-usage'
import type { GetTokenUsageListParams, GetTokenUsageStatsParams } from '@/types/token-usage'

export const tokenUsageQueryKeys = {
  all: ['token-usage'] as const,
  listBase: () => [...tokenUsageQueryKeys.all, 'list'] as const,
  list: (organizationId: string, params: GetTokenUsageListParams) =>
    [...tokenUsageQueryKeys.listBase(), organizationId, params] as const,
  detail: (organizationId: string, usageId: string) =>
    [...tokenUsageQueryKeys.all, 'detail', organizationId, usageId] as const,
  statsBase: () => [...tokenUsageQueryKeys.all, 'stats'] as const,
  stats: (organizationId: string, params: GetTokenUsageStatsParams) =>
    [...tokenUsageQueryKeys.statsBase(), organizationId, params] as const,
}

export interface UseTokenUsageListOptions extends GetTokenUsageListParams {
  enabled?: boolean
}

export function useTokenUsageList(organizationId: string, options: UseTokenUsageListOptions = {}) {
  const { enabled = true, ...params } = options

  return useQuery({
    queryKey: tokenUsageQueryKeys.list(organizationId, params),
    queryFn: () => getTokenUsageList(organizationId, params),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
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

export interface UseTokenUsageStatsOptions extends GetTokenUsageStatsParams {
  enabled?: boolean
}

export function useTokenUsageStats(organizationId: string, options: UseTokenUsageStatsOptions = {}) {
  const { enabled = true, ...params } = options

  return useQuery({
    queryKey: tokenUsageQueryKeys.stats(organizationId, params),
    queryFn: () => getTokenUsageStats(organizationId, params),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}
