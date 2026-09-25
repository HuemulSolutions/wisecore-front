import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  Notification,
  NotificationResponse,
  NotificationsResponse,
  GetNotificationsParams,
  CreateNotificationRequest,
} from '@/types/notifications'

const BASE_URL = `${backendUrl}/notifications`

export async function getNotifications(
  organizationId: string,
  params: GetNotificationsParams = {},
): Promise<NotificationsResponse> {
  const { page = 1, page_size = 100, is_read, document_id, execution_id, event_type } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (is_read !== undefined) query.set('is_read', is_read.toString())
  if (document_id) query.set('document_id', document_id)
  if (execution_id) query.set('execution_id', execution_id)
  if (event_type?.trim()) query.set('event_type', event_type.trim())

  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<NotificationsResponse>
}

export async function getNotification(
  organizationId: string,
  notificationId: string,
): Promise<Notification> {
  const response = await httpClient.get(`${BASE_URL}/${notificationId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as NotificationResponse
  return data.data
}

export async function createNotification(
  organizationId: string,
  body: CreateNotificationRequest,
): Promise<Notification> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as NotificationResponse
  return data.data
}

export async function deleteNotification(
  organizationId: string,
  notificationId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${notificationId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export async function markNotificationRead(
  organizationId: string,
  notificationId: string,
): Promise<Notification> {
  const response = await httpClient.patch(`${BASE_URL}/${notificationId}/read`, undefined, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as NotificationResponse
  return data.data
}

export async function markNotificationUnread(
  organizationId: string,
  notificationId: string,
): Promise<Notification> {
  const response = await httpClient.patch(`${BASE_URL}/${notificationId}/unread`, undefined, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as NotificationResponse
  return data.data
}

export type { Notification, NotificationsResponse }
