import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExternalSecrets,
  getExternalSecret,
  createExternalSecret,
  updateExternalSecret,
  deleteExternalSecret,
} from '@/services/external-secrets'
import type {
  CreateExternalSecretRequest,
  UpdateExternalSecretRequest,
} from '@/types/external-secrets'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const externalSecretQueryKeys = {
  all: ['external-secrets'] as const,
  listBase: () => [...externalSecretQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, systemId: string, secretId: string) =>
    [...externalSecretQueryKeys.all, 'detail', organizationId, systemId, secretId] as const,
  list: (
    organizationId: string,
    systemId: string,
    page: number,
    pageSize: number,
    search?: string,
  ) =>
    [
      ...externalSecretQueryKeys.listBase(),
      organizationId,
      systemId,
      page,
      pageSize,
      search ?? '',
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseExternalSecretsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useExternalSecrets(
  organizationId: string,
  systemId: string,
  options: UseExternalSecretsOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 50, search } = options

  return useQuery({
    queryKey: externalSecretQueryKeys.list(organizationId, systemId, page, pageSize, search),
    queryFn: () =>
      getExternalSecrets(organizationId, systemId, { page, page_size: pageSize, search }),
    enabled: enabled && !!organizationId && !!systemId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useExternalSecret(
  organizationId: string,
  systemId: string,
  secretId: string,
) {
  return useQuery({
    queryKey: externalSecretQueryKeys.detail(organizationId, systemId, secretId),
    queryFn: () => getExternalSecret(organizationId, systemId, secretId),
    enabled: !!organizationId && !!systemId && !!secretId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useExternalSecretMutations(organizationId: string, systemId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: externalSecretQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateExternalSecretRequest) =>
      createExternalSecret(organizationId, systemId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      secretId,
      body,
    }: {
      secretId: string
      body: UpdateExternalSecretRequest
    }) => updateExternalSecret(organizationId, systemId, secretId, body),
    onSuccess: (_data, { secretId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: externalSecretQueryKeys.detail(organizationId, systemId, secretId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (secretId: string) =>
      deleteExternalSecret(organizationId, systemId, secretId),
    onSuccess: (_data, secretId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: externalSecretQueryKeys.detail(organizationId, systemId, secretId),
      })
    },
  })

  return {
    createExternalSecret: createMutation,
    updateExternalSecret: updateMutation,
    deleteExternalSecret: deleteMutation,
  }
}
