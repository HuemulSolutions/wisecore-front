import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  Subscription,
  SubscriptionResponse,
  SubscriptionsResponse,
  GetSubscriptionsParams,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '@/types/subscriptions'

const BASE_URL = `${backendUrl}/subscriptions`

export async function getSubscriptions(
  organizationId: string,
  params: GetSubscriptionsParams = {},
): Promise<SubscriptionsResponse> {
  const { page = 1, page_size = 100, document_id, execution_id, event_type, reaction_type } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (document_id) query.set('document_id', document_id)
  if (execution_id) query.set('execution_id', execution_id)
  if (event_type?.trim()) query.set('event_type', event_type.trim())
  if (reaction_type?.trim()) query.set('reaction_type', reaction_type.trim())

  const response = await httpClient.get(`${BASE_URL}/?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  return response.json() as Promise<SubscriptionsResponse>
}

export async function getSubscription(
  organizationId: string,
  subscriptionId: string,
): Promise<Subscription> {
  const response = await httpClient.get(`${BASE_URL}/${subscriptionId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as SubscriptionResponse
  return data.data
}

export async function createSubscription(
  organizationId: string,
  body: CreateSubscriptionRequest,
): Promise<Subscription> {
  const response = await httpClient.post(`${BASE_URL}/`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as SubscriptionResponse
  return data.data
}

export async function updateSubscription(
  organizationId: string,
  subscriptionId: string,
  body: UpdateSubscriptionRequest,
): Promise<Subscription> {
  const response = await httpClient.put(`${BASE_URL}/${subscriptionId}`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as SubscriptionResponse
  return data.data
}

export async function deleteSubscription(
  organizationId: string,
  subscriptionId: string,
): Promise<void> {
  await httpClient.delete(`${BASE_URL}/${subscriptionId}`, {
    headers: { 'X-Org-Id': organizationId },
  })
}

export type { Subscription, SubscriptionsResponse }
