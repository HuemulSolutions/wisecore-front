import { useQuery } from '@tanstack/react-query'
import { getDocumentChangeLog } from '@/services/document-change-log'
import type { DocumentChangeType } from '@/types/document-change-log'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const documentChangeLogQueryKeys = {
  all: ['document-change-log'] as const,
  listBase: () => [...documentChangeLogQueryKeys.all, 'list'] as const,
  list: (
    organizationId: string,
    documentId: string,
    page: number,
    pageSize: number,
    changeType?: DocumentChangeType,
  ) =>
    [
      ...documentChangeLogQueryKeys.listBase(),
      organizationId,
      documentId,
      page,
      pageSize,
      changeType ?? 'all',
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseDocumentChangeLogOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  changeType?: DocumentChangeType
}

// ─── Query ────────────────────────────────────────────────────────────────────

export function useDocumentChangeLog(
  organizationId: string,
  documentId: string,
  options: UseDocumentChangeLogOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 100, changeType } = options

  return useQuery({
    queryKey: documentChangeLogQueryKeys.list(organizationId, documentId, page, pageSize, changeType),
    queryFn: () =>
      getDocumentChangeLog(organizationId, documentId, {
        page,
        page_size: pageSize,
        change_type: changeType,
      }),
    enabled: enabled && !!organizationId && !!documentId,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}
