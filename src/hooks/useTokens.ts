import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTokens, getToken, createToken } from '@/services/tokens'
import type { CreateTokenRequest, UseTokensOptions } from '@/types/tokens'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const tokenQueryKeys = {
  all: ['tokens'] as const,
  listBase: () => [...tokenQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, tokenId: string) =>
    [...tokenQueryKeys.all, 'detail', organizationId, tokenId] as const,
  list: (organizationId: string, page: number, pageSize: number, search?: string) =>
    [...tokenQueryKeys.listBase(), organizationId, page, pageSize, search ?? ''] as const,
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useTokens(organizationId: string, options: UseTokensOptions = {}) {
  const { enabled = true, page = 1, pageSize = 100, search } = options

  return useQuery({
    queryKey: tokenQueryKeys.list(organizationId, page, pageSize, search),
    queryFn: () => getTokens(organizationId, { page, page_size: pageSize, search }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useToken(organizationId: string, tokenId: string) {
  return useQuery({
    queryKey: tokenQueryKeys.detail(organizationId, tokenId),
    queryFn: () => getToken(organizationId, tokenId),
    enabled: !!organizationId && !!tokenId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useTokenMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: tokenQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateTokenRequest) => createToken(organizationId, body),
    onSuccess: invalidateList,
  })

  return {
    createToken: createMutation,
  }
}
