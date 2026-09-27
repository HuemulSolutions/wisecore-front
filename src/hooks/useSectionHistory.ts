import { useQuery } from '@tanstack/react-query'
import { getSectionExecutionHistory } from '@/services/section_execution'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const sectionHistoryQueryKeys = {
  all: ['section-history'] as const,
  detail: (sectionExecutionId: string) => [...sectionHistoryQueryKeys.all, sectionExecutionId] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseSectionHistoryOptions {
  enabled?: boolean
}

// ─── Query ────────────────────────────────────────────────────────────────────

/**
 * Historial de una sección (`GET /section_executions/{id}/history`). El
 * endpoint no pagina ni filtra: devuelve `{ total, items }` completo en una
 * sola llamada. Antes era un `useQuery` inline en `SectionHistorySheet`, sin
 * key namespaced ni invalidación posible desde otro archivo.
 */
export function useSectionHistory(
  sectionExecutionId: string,
  organizationId: string | undefined,
  options: UseSectionHistoryOptions = {},
) {
  const { enabled = true } = options

  return useQuery({
    queryKey: sectionHistoryQueryKeys.detail(sectionExecutionId),
    queryFn: () => getSectionExecutionHistory(sectionExecutionId, organizationId),
    enabled: enabled && !!sectionExecutionId,
    staleTime: 30_000,
    retry: 0,
  })
}
