import { useMutation, useQuery } from '@tanstack/react-query'
import { getExternalAssetImportRun, importAssetFromExternal } from '@/services/external-asset-import'
import type { ExternalAssetImportRequest, ExternalAssetImportRunStatus } from '@/types/external-asset-import'

// Cada cuánto se consulta una importación asíncrona mientras el sistema externo trabaja.
export const EXTERNAL_IMPORT_RUN_POLL_MS = 3_000

const TERMINAL_RUN_STATUSES: ReadonlySet<ExternalAssetImportRunStatus> = new Set(['completed', 'failed'])

export const externalAssetImportQueryKeys = {
  all: ['external-asset-import'] as const,
  run: (organizationId: string, importRunId: string) =>
    [...externalAssetImportQueryKeys.all, 'run', organizationId, importRunId] as const,
}

// Mutation: resolves to the created asset (sync functionality) or to the import run (async).
export function useExternalAssetImportMutation(organizationId: string) {
  return useMutation({
    mutationFn: ({ body, signal }: { body: ExternalAssetImportRequest; signal?: AbortSignal }) =>
      importAssetFromExternal(organizationId, body, { signal }),
    // The success toast needs the created asset's name, so it's shown by the sheet itself.
    meta: { showSuccessToast: false },
  })
}

// Polls an async import until it is completed or failed.
export function useExternalAssetImportRun(
  organizationId: string,
  importRunId: string | null,
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: externalAssetImportQueryKeys.run(organizationId, importRunId ?? ''),
    queryFn: () => getExternalAssetImportRun(organizationId, importRunId as string),
    enabled: (options.enabled ?? true) && !!organizationId && !!importRunId,
    refetchInterval: (query) => {
      // Corte por error primero: `data` conserva el último valor no terminal
      // (ver ia context/refetch-interval-polling-guide.md).
      if (query.state.status === 'error') return false
      const status = query.state.data?.status
      if (status && TERMINAL_RUN_STATUSES.has(status)) return false
      return EXTERNAL_IMPORT_RUN_POLL_MS
    },
    refetchOnWindowFocus: false,
  })
}
