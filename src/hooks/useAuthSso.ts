import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import i18n from '@/i18n'
import { createInvitation, getMyIdentities, listInvitations, startLinkIdentity } from '@/services/auth-sso'
import type { CreateInvitationRequest } from '@/types/auth-sso'

export const authSsoQueryKeys = {
  all: ['auth-sso'] as const,
  identities: () => [...authSsoQueryKeys.all, 'identities', 'me'] as const,
  invitations: (organizationId: string, includeAccepted: boolean) =>
    [...authSsoQueryKeys.all, 'invitations', organizationId, includeAccepted] as const,
}

export function useMyIdentities(enabled = true) {
  return useQuery({
    queryKey: authSsoQueryKeys.identities(),
    queryFn: getMyIdentities,
    enabled,
    staleTime: 60 * 1000,
    retry: 0,
  })
}

export function useLinkIdentity() {
  return useMutation({
    mutationFn: ({ connectionId, returnTo }: { connectionId: string; returnTo?: string | null }) =>
      startLinkIdentity(connectionId, returnTo),
  })
}

export function useInvitations(organizationId: string | null, includeAccepted = false) {
  return useQuery({
    queryKey: authSsoQueryKeys.invitations(organizationId ?? '', includeAccepted),
    queryFn: () => listInvitations(organizationId as string, includeAccepted),
    enabled: !!organizationId,
    staleTime: 60 * 1000,
    retry: 0,
  })
}

export function useInvitationMutations(organizationId: string | null) {
  const queryClient = useQueryClient()
  const create = useMutation({
    mutationFn: (body: CreateInvitationRequest) => createInvitation(organizationId as string, body),
    meta: { successMessage: i18n.t('auth:invitations.created') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...authSsoQueryKeys.all, 'invitations'] })
    },
  })
  return { create }
}
