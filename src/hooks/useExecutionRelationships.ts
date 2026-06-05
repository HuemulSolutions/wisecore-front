import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExecutionRelationshipsByExecution,
  getExecutionRelationship,
  createExecutionRelationship,
  updateExecutionRelationship,
  deleteExecutionRelationship,
} from '@/services/execution-relationships'
import type {
  ExecutionRelationshipDirection,
  CreateExecutionRelationshipRequest,
  UpdateExecutionRelationshipRequest,
} from '@/types/execution-relationships'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const executionRelationshipQueryKeys = {
  all: ['execution-relationships'] as const,
  listBase: () => [...executionRelationshipQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, executionRelationshipId: string) =>
    [
      ...executionRelationshipQueryKeys.all,
      'detail',
      organizationId,
      executionRelationshipId,
    ] as const,
  list: (
    organizationId: string,
    executionId: string,
    page: number,
    pageSize: number,
    direction?: ExecutionRelationshipDirection,
    includeSubrelationships?: boolean,
  ) =>
    [
      ...executionRelationshipQueryKeys.listBase(),
      organizationId,
      executionId,
      page,
      pageSize,
      direction ?? 'all',
      includeSubrelationships ?? false,
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseExecutionRelationshipsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  direction?: ExecutionRelationshipDirection
  includeSubrelationships?: boolean
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useExecutionRelationships(
  organizationId: string,
  executionId: string,
  options: UseExecutionRelationshipsOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 100, direction, includeSubrelationships } = options

  return useQuery({
    queryKey: executionRelationshipQueryKeys.list(
      organizationId,
      executionId,
      page,
      pageSize,
      direction,
      includeSubrelationships,
    ),
    queryFn: () =>
      getExecutionRelationshipsByExecution(organizationId, executionId, {
        page,
        page_size: pageSize,
        direction,
        include_subrelationships: includeSubrelationships,
      }),
    enabled: enabled && !!organizationId && !!executionId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useExecutionRelationship(
  organizationId: string,
  executionRelationshipId: string,
) {
  return useQuery({
    queryKey: executionRelationshipQueryKeys.detail(organizationId, executionRelationshipId),
    queryFn: () => getExecutionRelationship(organizationId, executionRelationshipId),
    enabled: !!organizationId && !!executionRelationshipId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useExecutionRelationshipMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: executionRelationshipQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateExecutionRelationshipRequest) =>
      createExecutionRelationship(organizationId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      executionRelationshipId,
      body,
    }: {
      executionRelationshipId: string
      body: UpdateExecutionRelationshipRequest
    }) => updateExecutionRelationship(organizationId, executionRelationshipId, body),
    onSuccess: (_data, { executionRelationshipId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: executionRelationshipQueryKeys.detail(
          organizationId,
          executionRelationshipId,
        ),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (executionRelationshipId: string) =>
      deleteExecutionRelationship(organizationId, executionRelationshipId),
    onSuccess: (_data, executionRelationshipId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: executionRelationshipQueryKeys.detail(
          organizationId,
          executionRelationshipId,
        ),
      })
    },
  })

  return {
    createExecutionRelationship: createMutation,
    updateExecutionRelationship: updateMutation,
    deleteExecutionRelationship: deleteMutation,
  }
}
