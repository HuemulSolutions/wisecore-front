import { useEffect } from "react"
import type { RefObject } from "react"
import { getLibraryContent } from "@/services/folders"
import { useTreeExpansionStorage } from "@/hooks/useTreeExpansionStorage"
import { ApiError } from "@/types/api-error"
import type { LibraryContent, GetLibraryContentFilters } from "@/types/folders"
import type { HuemulFileTreeRef } from "@/types/huemul"

export interface LibraryRootLoadParams {
  page?: number
  pageSize?: number
  focusAssetId?: string | null
  includeExecutions?: boolean
  filters?: GetLibraryContentFilters
}

export interface UseLibraryTreeExpansionOptions {
  organizationId: string | null | undefined
  /**
   * Refresca una vez el árbol si el servidor trajo, al montar, un set de
   * expansión distinto del caché local (otro navegador/dispositivo cambió la
   * expansión mientras tanto). Solo tiene sentido en una superficie
   * persistente montada todo el tiempo (el sidebar) — un picker/diálogo
   * efímero se monta después de que esa hidratación ya resolvió, y
   * refrescarlo bajo el cursor del usuario sería peor que el problema que
   * resuelve. Default `false`.
   */
  refreshOnServerDiffered?: boolean
  treeRef?: RefObject<HuemulFileTreeRef | null>
}

export interface UseLibraryTreeExpansionResult {
  /** Lectura síncrona del set vigente (vacío si el switch "recordar" está apagado). */
  expandedIdsRef: React.MutableRefObject<string[]>
  /**
   * Carga root de la biblioteca con `expanded_folder_ids` (+ `focus_asset_id`
   * si se pide) resueltos server-side. Si el backend rechaza el
   * enriquecimiento (400 combinación inválida, 404 asset no alcanzable), cae
   * a una carga root plana en vez de fallar — `enriched: false` en ese caso,
   * señal de que la respuesta NO trae `is_expanded` confiable y el árbol debe
   * construirse con el mapeo plano de siempre, no con `buildLibraryTree`.
   */
  loadRoot: (params?: LibraryRootLoadParams) => Promise<{ content: LibraryContent; enriched: boolean }>
  /** Escupir sobre `<HuemulFileTree {...treeProps} />`. */
  treeProps: {
    preserveExpandedOnRefresh: false
    onExpandedFoldersChange: (folderIds: string[], context: { knownIds: string[] }) => void
  }
}

/**
 * Cablea un árbol de la biblioteca de activos (sidebar, picker, selector de
 * carpeta) a la persistencia compartida de expansión (`useTreeExpansionStorage`)
 * sin repetir en cada consumidor: leer el set guardado, mandarlo en la carga
 * root, manejar el fallback si el backend lo rechaza, y devolver las props
 * listas para el árbol. Ver ia context/arbol-biblioteca-activos-guide.md.
 */
export function useLibraryTreeExpansion({
  organizationId,
  refreshOnServerDiffered = false,
  treeRef,
}: UseLibraryTreeExpansionOptions): UseLibraryTreeExpansionResult {
  const { expandedIdsRef, saveExpandedIds, serverDiffered } = useTreeExpansionStorage(organizationId)

  useEffect(() => {
    if (refreshOnServerDiffered && serverDiffered) treeRef?.current?.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverDiffered, refreshOnServerDiffered])

  const loadRoot = async ({
    page = 1,
    pageSize = 1000,
    focusAssetId,
    includeExecutions,
    filters,
  }: LibraryRootLoadParams = {}): Promise<{ content: LibraryContent; enriched: boolean }> => {
    if (!organizationId) return { content: { folders: [], assets: [], has_next: false }, enriched: false }

    const expandedFolderIds = expandedIdsRef.current
    const enrichedRootLoad = !!focusAssetId || expandedFolderIds.length > 0

    if (!enrichedRootLoad) {
      const content = await getLibraryContent(organizationId, undefined, page, pageSize, undefined, filters, undefined, { includeExecutions })
      return { content, enriched: false }
    }

    try {
      const content = await getLibraryContent(
        organizationId,
        undefined,
        page,
        pageSize,
        undefined,
        filters,
        focusAssetId ?? undefined,
        { expandedFolderIds, includeExecutions },
      )
      return { content, enriched: true }
    } catch (error) {
      if (!ApiError.isApiError(error) || (error.statusCode !== 404 && error.statusCode !== 400)) {
        throw error
      }
      // 404: el asset enfocado no existe / no es alcanzable en esta org. 400:
      // el backend rechazó la combinación (p. ej. INVALID_FOLDER_EXPANDED_IDS_LIMIT).
      // Falla del enriquecimiento, no de la carga en sí — cae a una carga root
      // plana en vez de dejar al árbol vacío.
      const content = await getLibraryContent(organizationId, undefined, page, pageSize, undefined, filters, undefined, { includeExecutions })
      return { content, enriched: false }
    }
  }

  return {
    expandedIdsRef,
    loadRoot,
    treeProps: {
      preserveExpandedOnRefresh: false,
      onExpandedFoldersChange: saveExpandedIds,
    },
  }
}
