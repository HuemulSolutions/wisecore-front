import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  DocumentChangeLogResponse,
  GetDocumentChangeLogParams,
} from '@/types/document-change-log'

const BASE_URL = `${backendUrl}/documents`

export async function getDocumentChangeLog(
  organizationId: string,
  documentId: string,
  params: GetDocumentChangeLogParams = {},
): Promise<DocumentChangeLogResponse> {
  const { page = 1, page_size = 100, change_type } = params

  const query = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
  })
  if (change_type) query.set('change_type', change_type)

  const response = await httpClient.get(`${BASE_URL}/${documentId}/change-log?${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })

  return response.json() as Promise<DocumentChangeLogResponse>
}

export type { DocumentChangeLogEntry, DocumentChangeLogResponse } from '@/types/document-change-log'
