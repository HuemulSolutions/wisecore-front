import { useQuery } from '@tanstack/react-query'
import { getDocumentStatistics } from '@/services/assets'
import type { DocumentStatisticsScope } from '@/types/assets'

export const documentStatisticsQueryKeys = {
  all: ['document-statistics'] as const,
  byOrg: (organizationId: string, scope: DocumentStatisticsScope | undefined) =>
    [...documentStatisticsQueryKeys.all, organizationId, scope ?? 'organization'] as const,
}

/** Sin `scope`, comportamiento actual sin cambios (`organization`, los 8 contadores de siempre). `scope: 'me'` agrega los 5 contadores personales (ver `DocumentStatistics`). */
export function useDocumentStatistics(organizationId: string, enabled = true, scope?: DocumentStatisticsScope) {
  return useQuery({
    queryKey: documentStatisticsQueryKeys.byOrg(organizationId, scope),
    queryFn: () => getDocumentStatistics(organizationId, scope),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}
