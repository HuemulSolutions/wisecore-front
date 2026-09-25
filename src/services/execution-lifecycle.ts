import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  ExecutionEventsResponse,
  GetExecutionEventsParams,
} from '@/types/execution-lifecycle'

const BASE_URL = `${backendUrl}/execution-lifecycle`

export async function getExecutionEvents(
  organizationId: string,
  executionId: string,
  params: GetExecutionEventsParams = {},
): Promise<ExecutionEventsResponse> {
  const { page = 1, page_size = 100 } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })

  const response = await httpClient.get(`${BASE_URL}/${executionId}/events?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })

  return response.json() as Promise<ExecutionEventsResponse>
}

export type { ExecutionEvent, ExecutionEventsResponse } from '@/types/execution-lifecycle'
