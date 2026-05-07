import { useQuery } from '@tanstack/react-query'
import { getAllExecutions } from '@/services/executions'
import type { ExecutionLifecycleState } from '@/types/executions'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const executionQueryKeys = {
  all: ['executions'] as const,
  listBase: () => [...executionQueryKeys.all, 'list'] as const,
  list: (organizationId: string, params: Omit<UseAllExecutionsOptions, 'enabled'>) =>
    [...executionQueryKeys.listBase(), organizationId, params] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseAllExecutionsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  has_pending_ai_suggestion?: boolean | null
  lifecycle_state?: ExecutionLifecycleState | null
  owner_scope?: 'all' | 'me' | null
  has_unresolved_comments?: boolean | null
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useAllExecutions(organizationId: string, options: UseAllExecutionsOptions = {}) {
  const { enabled = true, page = 1, pageSize = 100, search, has_pending_ai_suggestion, lifecycle_state, owner_scope, has_unresolved_comments } = options

  return useQuery({
    queryKey: executionQueryKeys.list(organizationId, { page, pageSize, search, has_pending_ai_suggestion, lifecycle_state, owner_scope, has_unresolved_comments }),
    queryFn: () =>
      getAllExecutions(organizationId, { page, page_size: pageSize, search, has_pending_ai_suggestion, lifecycle_state, owner_scope, has_unresolved_comments }),
    enabled: enabled && !!organizationId,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}
