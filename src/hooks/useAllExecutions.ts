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
  created_by?: string | null
  has_pending_ai_suggestion?: boolean | null
  lifecycle_state?: ExecutionLifecycleState | null
  owner_scope?: 'all' | 'me' | null
  has_unresolved_comments?: boolean | null
  expiration_date?: string | null
  expiration_date_from?: string | null
  expiration_date_to?: string | null
  estimated_publication_date?: string | null
  estimated_publication_date_from?: string | null
  estimated_publication_date_to?: string | null
  review_date?: string | null
  review_date_from?: string | null
  review_date_to?: string | null
  audit_date?: string | null
  audit_date_from?: string | null
  audit_date_to?: string | null
  template_id?: string | null
  document_type_id?: string | null
  sort?: string | null
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useAllExecutions(organizationId: string, options: UseAllExecutionsOptions = {}) {
  const {
    enabled = true,
    page = 1,
    pageSize = 100,
    search,
    created_by,
    has_pending_ai_suggestion,
    lifecycle_state,
    owner_scope,
    has_unresolved_comments,
    expiration_date,
    expiration_date_from,
    expiration_date_to,
    estimated_publication_date,
    estimated_publication_date_from,
    estimated_publication_date_to,
    review_date,
    review_date_from,
    review_date_to,
    audit_date,
    audit_date_from,
    audit_date_to,
    template_id,
    document_type_id,
    sort,
  } = options

  const params = {
    page,
    pageSize,
    search,
    created_by,
    has_pending_ai_suggestion,
    lifecycle_state,
    owner_scope,
    has_unresolved_comments,
    expiration_date,
    expiration_date_from,
    expiration_date_to,
    estimated_publication_date,
    estimated_publication_date_from,
    estimated_publication_date_to,
    review_date,
    review_date_from,
    review_date_to,
    audit_date,
    audit_date_from,
    audit_date_to,
    template_id,
    document_type_id,
    sort,
  }

  return useQuery({
    queryKey: executionQueryKeys.list(organizationId, params),
    queryFn: () =>
      getAllExecutions(organizationId, {
        page,
        page_size: pageSize,
        search,
        created_by,
        has_pending_ai_suggestion,
        lifecycle_state,
        owner_scope,
        has_unresolved_comments,
        expiration_date,
        expiration_date_from,
        expiration_date_to,
        estimated_publication_date,
        estimated_publication_date_from,
        estimated_publication_date_to,
        review_date,
        review_date_from,
        review_date_to,
        audit_date,
        audit_date_from,
        audit_date_to,
        template_id,
        document_type_id,
        sort,
      }),
    enabled: enabled && !!organizationId,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}
