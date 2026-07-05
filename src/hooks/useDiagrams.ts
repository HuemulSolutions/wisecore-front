import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDiagrams,
  getDiagram,
  createDiagram,
  updateDiagram,
  deleteDiagram,
} from '@/services/diagrams'
import type { CreateDiagramRequest, UpdateDiagramRequest } from '@/types/diagrams'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const diagramQueryKeys = {
  all: ['diagrams'] as const,
  listBase: () => [...diagramQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, diagramId: string) =>
    [...diagramQueryKeys.all, 'detail', organizationId, diagramId] as const,
  list: (
    organizationId: string,
    page: number,
    pageSize: number,
    search?: string,
    executionId?: string,
  ) =>
    [
      ...diagramQueryKeys.listBase(),
      organizationId,
      page,
      pageSize,
      search ?? '',
      executionId ?? '',
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseDiagramsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  executionId?: string
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useDiagrams(organizationId: string, options: UseDiagramsOptions = {}) {
  const { enabled = true, page = 1, pageSize = 100, search, executionId } = options

  return useQuery({
    queryKey: diagramQueryKeys.list(organizationId, page, pageSize, search, executionId),
    queryFn: () =>
      getDiagrams(organizationId, {
        page,
        page_size: pageSize,
        search,
        execution_id: executionId,
      }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useDiagram(organizationId: string, diagramId: string) {
  return useQuery({
    queryKey: diagramQueryKeys.detail(organizationId, diagramId),
    queryFn: () => getDiagram(organizationId, diagramId),
    enabled: !!organizationId && !!diagramId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useDiagramMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: diagramQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateDiagramRequest) => createDiagram(organizationId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({ diagramId, body }: { diagramId: string; body: UpdateDiagramRequest }) =>
      updateDiagram(organizationId, diagramId, body),
    onSuccess: (_data, { diagramId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: diagramQueryKeys.detail(organizationId, diagramId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (diagramId: string) => deleteDiagram(organizationId, diagramId),
    onSuccess: (_data, diagramId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: diagramQueryKeys.detail(organizationId, diagramId),
      })
    },
  })

  return {
    createDiagram: createMutation,
    updateDiagram: updateMutation,
    deleteDiagram: deleteMutation,
  }
}
