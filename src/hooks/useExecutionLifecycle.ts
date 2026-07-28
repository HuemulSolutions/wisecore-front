import { useQuery } from '@tanstack/react-query'
import { getExecutionEvents } from '@/services/execution-lifecycle'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const executionLifecycleQueryKeys = {
  all: ['execution-lifecycle'] as const,
  eventsBase: () => [...executionLifecycleQueryKeys.all, 'events'] as const,
  events: (organizationId: string, executionId: string, page: number, pageSize: number) =>
    [
      ...executionLifecycleQueryKeys.eventsBase(),
      organizationId,
      executionId,
      page,
      pageSize,
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseExecutionEventsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function useExecutionEvents(
  organizationId: string,
  executionId: string,
  options: UseExecutionEventsOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 100 } = options

  return useQuery({
    queryKey: executionLifecycleQueryKeys.events(organizationId, executionId, page, pageSize),
    queryFn: () => getExecutionEvents(organizationId, executionId, { page, page_size: pageSize }),
    enabled: enabled && !!organizationId && !!executionId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}
