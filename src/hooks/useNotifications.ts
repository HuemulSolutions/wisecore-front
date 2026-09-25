import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  getNotification,
  createNotification,
  deleteNotification,
  markNotificationRead,
  markNotificationUnread,
} from '@/services/notifications'
import type { CreateNotificationRequest } from '@/types/notifications'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  listBase: () => [...notificationQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, notificationId: string) =>
    [...notificationQueryKeys.all, 'detail', organizationId, notificationId] as const,
  list: (
    organizationId: string,
    page: number,
    pageSize: number,
    isRead?: boolean,
    documentId?: string,
    executionId?: string,
    eventType?: string,
  ) =>
    [
      ...notificationQueryKeys.listBase(),
      organizationId,
      page,
      pageSize,
      isRead ?? '',
      documentId ?? '',
      executionId ?? '',
      eventType ?? '',
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseNotificationsOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  isRead?: boolean
  documentId?: string
  executionId?: string
  eventType?: string
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useNotifications(
  organizationId: string,
  options: UseNotificationsOptions = {},
) {
  const {
    enabled = true,
    page = 1,
    pageSize = 100,
    isRead,
    documentId,
    executionId,
    eventType,
  } = options

  return useQuery({
    queryKey: notificationQueryKeys.list(
      organizationId,
      page,
      pageSize,
      isRead,
      documentId,
      executionId,
      eventType,
    ),
    queryFn: () =>
      getNotifications(organizationId, {
        page,
        page_size: pageSize,
        is_read: isRead,
        document_id: documentId,
        execution_id: executionId,
        event_type: eventType,
      }),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useNotification(organizationId: string, notificationId: string) {
  return useQuery({
    queryKey: notificationQueryKeys.detail(organizationId, notificationId),
    queryFn: () => getNotification(organizationId, notificationId),
    enabled: !!organizationId && !!notificationId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useNotificationMutations(organizationId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateNotificationRequest) =>
      createNotification(organizationId, body),
    onSuccess: invalidateList,
  })

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) =>
      deleteNotification(organizationId, notificationId),
    onSuccess: (_data, notificationId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: notificationQueryKeys.detail(organizationId, notificationId),
      })
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(organizationId, notificationId),
    onSuccess: (_data, notificationId) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.detail(organizationId, notificationId),
      })
    },
  })

  const markUnreadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationUnread(organizationId, notificationId),
    onSuccess: (_data, notificationId) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.detail(organizationId, notificationId),
      })
    },
  })

  return {
    createNotification: createMutation,
    deleteNotification: deleteMutation,
    markNotificationRead: markReadMutation,
    markNotificationUnread: markUnreadMutation,
  }
}
