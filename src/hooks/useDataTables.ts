import { useQuery } from '@tanstack/react-query'
import { getDataTableSources } from '@/services/data-tables'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const dataTableQueryKeys = {
  all: ['data-table'] as const,
  sources: () => [...dataTableQueryKeys.all, 'sources'] as const,

  resolveBase: () => [...dataTableQueryKeys.all, 'resolve'] as const,
  resolveDocument: (documentId: string) => [...dataTableQueryKeys.resolveBase(), documentId] as const,
  resolve: (documentId: string, executionId: string | null, batchHash: string) =>
    [...dataTableQueryKeys.resolveDocument(documentId), executionId ?? 'default', batchHash] as const,

  previewBase: () => [...dataTableQueryKeys.all, 'preview'] as const,
  preview: (documentId: string | null, executionId: string | null, specHash: string) =>
    [...dataTableQueryKeys.previewBase(), documentId ?? 'none', executionId ?? 'default', specHash] as const,
}

// ─── Catálogo ─────────────────────────────────────────────────────────────────

/** Catálogo de fuentes/columnas/filtros — cache larga, se pide una vez por sesión. */
export function useDataTableSources(organizationId: string | undefined) {
  return useQuery({
    queryKey: dataTableQueryKeys.sources(),
    queryFn: () => getDataTableSources(organizationId!),
    enabled: !!organizationId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}
