import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from '@/services/subscriptions'
import type {
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '@/types/subscriptions'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const subscriptionQueryKeys = {
  all: ['subscriptions'] as const,
  listBase: () => [...subscriptionQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, subscriptionId: string) =>
    [...subscriptionQueryKeys.all, 'detail', organizationId, subscriptionId] as const,
  list: (
    organizationId: string,
    page: number,
    pageSize: number,
    documentId?: string,
    executionId?: string,
    eventType?: string,
    reactionType?: string,
  ) =>
    [
      ...subscriptionQueryKeys.listBase(),
      organizationId,
      page,
      pageSize,
      documentId ?? '',
      executionId ?? '',
      eventType ?? '',
      reactionType ?? '',
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseSubscriptionsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  documentId?: string
  executionId?: string
  eventType?: string
  reactionType?: string
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useSubscriptions(
  organizationId: string,
  options: UseSubscriptionsOptions = {},
) {
  const {
    enabled = true,
    page = 1,
    pageSize = 100,
    documentId,
    executionId,
    eventType,
    reactionType,
  } = options

  return useQuery({
    queryKey: subscriptionQueryKeys.list(
      organizationId,
      page,
      pageSize,
      documentId,
      executionId,
      eventType,
      reactionType,
    ),
    queryFn: () =>
      getSubscriptions(organizationId, {
        page,
        page_size: pageSize,
        document_id: documentId,
        execution_id: executionId,
        event_type: eventType,
        reaction_type: reactionType,
      }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useSubscription(organizationId: string, subscriptionId: string) {
  return useQuery({
    queryKey: subscriptionQueryKeys.detail(organizationId, subscriptionId),
    queryFn: () => getSubscription(organizationId, subscriptionId),
    enabled: !!organizationId && !!subscriptionId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSubscriptionMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateSubscriptionRequest) =>
      createSubscription(organizationId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      subscriptionId,
      body,
    }: {
      subscriptionId: string
      body: UpdateSubscriptionRequest
    }) => updateSubscription(organizationId, subscriptionId, body),
    onSuccess: (_data, { subscriptionId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.detail(organizationId, subscriptionId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (subscriptionId: string) =>
      deleteSubscription(organizationId, subscriptionId),
    onSuccess: (_data, subscriptionId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: subscriptionQueryKeys.detail(organizationId, subscriptionId),
      })
    },
  })

  return {
    createSubscription: createMutation,
    updateSubscription: updateMutation,
    deleteSubscription: deleteMutation,
  }
}
