import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExternalSystems,
  getExternalSystem,
  createExternalSystem,
  updateExternalSystem,
  deleteExternalSystem,
} from '@/services/external-systems'
import type {
  ExternalSystemStatus,
  CreateExternalSystemRequest,
  UpdateExternalSystemRequest,
} from '@/types/external-systems'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const externalSystemQueryKeys = {
  all: ['external-systems'] as const,
  listBase: () => [...externalSystemQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, systemId: string) =>
    [...externalSystemQueryKeys.all, 'detail', organizationId, systemId] as const,
  list: (
    organizationId: string,
    page: number,
    pageSize: number,
    search?: string,
    status?: ExternalSystemStatus,
  ) =>
    [
      ...externalSystemQueryKeys.listBase(),
      organizationId,
      page,
      pageSize,
      search ?? '',
      status ?? '',
    ] as const,
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseExternalSystemsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  status?: ExternalSystemStatus
}

export function useExternalSystems(
  organizationId: string,
  options: UseExternalSystemsOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 50, search, status } = options

  return useQuery({
    queryKey: externalSystemQueryKeys.list(organizationId, page, pageSize, search, status),
    queryFn: () =>
      getExternalSystems(organizationId, { page, page_size: pageSize, search, status }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useExternalSystem(organizationId: string, systemId: string) {
  return useQuery({
    queryKey: externalSystemQueryKeys.detail(organizationId, systemId),
    queryFn: () => getExternalSystem(organizationId, systemId),
    enabled: !!organizationId && !!systemId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useExternalSystemMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: externalSystemQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateExternalSystemRequest) =>
      createExternalSystem(organizationId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({ systemId, body }: { systemId: string; body: UpdateExternalSystemRequest }) =>
      updateExternalSystem(organizationId, systemId, body),
    onSuccess: (_data, { systemId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: externalSystemQueryKeys.detail(organizationId, systemId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (systemId: string) => deleteExternalSystem(organizationId, systemId),
    onSuccess: (_data, systemId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: externalSystemQueryKeys.detail(organizationId, systemId),
      })
    },
  })

  return {
    createExternalSystem: createMutation,
    updateExternalSystem: updateMutation,
    deleteExternalSystem: deleteMutation,
  }
}

