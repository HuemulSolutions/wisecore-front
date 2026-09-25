import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLibraryAssetsByIds } from '@/services/folders';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const libraryAssetQueryKeys = {
    all: ['library-assets'] as const,
    byIds: (organizationId: string, assetIds: string[], includeExecutions: boolean) =>
        [...libraryAssetQueryKeys.all, 'by-ids', organizationId, assetIds.join(','), includeExecutions] as const,
};

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseLibraryAssetsByIdsOptions {
    enabled?: boolean;
    includeExecutions?: boolean;
}

// ─── Batch query ──────────────────────────────────────────────────────────────

/**
 * Resuelve un lote puntual de documentos por ID en una sola llamada (asset_ids del backend).
 * Uso típico: pintar "chips" de documentos referenciadas dentro de otro documento,
 * cada una con su versión vigente vía includeExecutions.
 */
export function useLibraryAssetsByIds(
    organizationId: string,
    assetIds: string[],
    options: UseLibraryAssetsByIdsOptions = {},
) {
    const { enabled = true, includeExecutions = false } = options;

    const normalizedIds = useMemo(
        () => Array.from(new Set(assetIds.map((id) => id.trim()).filter((id) => id.length > 0))),
        [assetIds],
    );

    return useQuery({
        queryKey: libraryAssetQueryKeys.byIds(organizationId, normalizedIds, includeExecutions),
        queryFn: () => getLibraryAssetsByIds(organizationId, normalizedIds, { includeExecutions }),
        enabled: enabled && !!organizationId && normalizedIds.length > 0,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: 0,
    });
}
