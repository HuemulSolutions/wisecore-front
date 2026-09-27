import { useQuery } from '@tanstack/react-query';
import { getDocumentMediaUrls } from '@/services/assets';
import type { DocumentMediaUrls } from '@/types/assets';

/** Safety margin subtracted from the backend TTL before scheduling the next refresh. */
const REFRESH_MARGIN_SECONDS = 600;
/** Floor so a misconfigured/very short TTL can't cause a refresh storm. */
const MIN_REFETCH_INTERVAL_SECONDS = 60;
const DEFAULT_TTL_SECONDS = 3600;

export const documentMediaUrlsQueryKeys = {
  all: ['document-media-urls'] as const,
  detail: (documentId: string, executionId?: string) =>
    [...documentMediaUrlsQueryKeys.all, documentId, executionId ?? ''] as const,
};

export interface UseDocumentMediaUrlsOptions {
  enabled?: boolean;
  executionId?: string;
}

/**
 * Polls GET /documents/{id}/media_urls to keep media download URLs fresh in
 * long-lived tabs, without re-fetching the full document content. The refetch
 * cadence is derived from the backend's own `ttl_seconds` (never hardcoded)
 * so a TTL change on the backend is picked up automatically.
 */
export function useDocumentMediaUrls(
  documentId: string | undefined,
  organizationId: string | undefined,
  options: UseDocumentMediaUrlsOptions = {},
) {
  const { enabled = true, executionId } = options;

  return useQuery<DocumentMediaUrls>({
    queryKey: documentMediaUrlsQueryKeys.detail(documentId ?? '', executionId),
    queryFn: () => getDocumentMediaUrls(documentId!, organizationId!, { executionId }),
    enabled: enabled && !!documentId && !!organizationId,
    refetchInterval: (query) => {
      const ttl = query.state.data?.ttl_seconds ?? DEFAULT_TTL_SECONDS;
      const seconds = Math.max(MIN_REFETCH_INTERVAL_SECONDS, ttl - REFRESH_MARGIN_SECONDS);
      return seconds * 1000;
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 0,
  });
}
