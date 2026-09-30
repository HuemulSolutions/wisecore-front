import { useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useOrganization } from '@/contexts/organization-context'
import { buildSourceGroups } from '@/lib/source-utils'
import { contextsQueryOptions, dependenciesQueryOptions } from '../sources-queries'

/**
 * Fuentes de un asset: une dependencias (activos vinculados) y contextos (archivos y textos).
 * Única fuente de verdad del panel "Fuentes"; las mutaciones viven en `useAssetSourceActions`.
 *
 * `isLoading` solo es `true` mientras no hay NINGÚN dato (primera carga): un refetch en segundo
 * plano no vuelve a tapar la tabla con el skeleton (ver sheet-instant-open-skeleton-guide).
 */
export function useAssetSources(documentId: string, enabled: boolean) {
  const { selectedOrganizationId } = useOrganization()
  const orgId = selectedOrganizationId ?? ''
  const active = enabled && !!documentId && !!selectedOrganizationId

  const dependenciesQuery = useQuery({ ...dependenciesQueryOptions(documentId, orgId), enabled: active })
  const contextsQuery = useQuery({ ...contextsQueryOptions(documentId, orgId), enabled: active })

  const groups = useMemo(
    () => buildSourceGroups(dependenciesQuery.data, contextsQuery.data),
    [dependenciesQuery.data, contextsQuery.data],
  )

  const pendingRows = useMemo(
    () => [...groups.files, ...groups.texts].filter((row) => row.pending),
    [groups],
  )

  const isLoading = active && (dependenciesQuery.isPending || contextsQuery.isPending)
  const isError =
    (dependenciesQuery.isError && !dependenciesQuery.data) || (contextsQuery.isError && !contextsQuery.data)
  const isFetching = dependenciesQuery.isFetching || contextsQuery.isFetching

  const refetch = useCallback(
    () => Promise.all([dependenciesQuery.refetch(), contextsQuery.refetch()]),
    [dependenciesQuery, contextsQuery],
  )

  return {
    groups,
    pendingRows,
    pendingCount: pendingRows.length,
    assetCount: groups.assets.length,
    fileTextCount: groups.files.length + groups.texts.length,
    totalCount: groups.assets.length + groups.files.length + groups.texts.length,
    isLoading,
    isError,
    isFetching,
    refetch,
  }
}
