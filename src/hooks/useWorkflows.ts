import { useQuery } from "@tanstack/react-query"
import { getWorkflows } from "@/services/workflow"
import type { UseWorkflowsOptions } from "@/types/workflow"
export type { UseWorkflowsOptions }

// ─── Query keys ───────────────────────────────────────────────────────────────

export const workflowQueryKeys = {
  all: ["workflows"] as const,
  listBase: () => [...workflowQueryKeys.all, "list"] as const,
  list: (organizationId: string, params: Omit<UseWorkflowsOptions, "enabled">) =>
    [...workflowQueryKeys.listBase(), organizationId, params] as const,
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useWorkflows(organizationId: string, options: UseWorkflowsOptions = {}) {
  const { enabled = true, page = 1, pageSize = 100, search, document_type_id } = options

  const params = { page, pageSize, search, document_type_id }

  return useQuery({
    queryKey: workflowQueryKeys.list(organizationId, params),
    queryFn: () =>
      getWorkflows(organizationId, {
        page,
        page_size: pageSize,
        search,
        document_type_id,
      }),
    enabled: enabled && !!organizationId,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}
