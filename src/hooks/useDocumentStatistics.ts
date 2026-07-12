import { useQuery } from '@tanstack/react-query'
import { getDocumentStatistics } from '@/services/assets'

export const documentStatisticsQueryKeys = {
  all: ['document-statistics'] as const,
  byOrg: (organizationId: string) =>
    [...documentStatisticsQueryKeys.all, organizationId] as const,
}

export function useDocumentStatistics(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: documentStatisticsQueryKeys.byOrg(organizationId),
    queryFn: () => getDocumentStatistics(organizationId),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}
