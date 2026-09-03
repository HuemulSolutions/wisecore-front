import { useCallback, useEffect, useRef } from "react"

// Tope del backend para expanded_folder_ids (ver services/folders.ts) — se
// aplica también acá para no persistir más ids de los que se van a poder
// mandar de vuelta.
const MAX_EXPANDED_FOLDER_IDS = 200

const storageKey = (orgId: string | null | undefined) => `wisecore:tree-expanded:${orgId ?? 'none'}`

function readStored(orgId: string | null | undefined): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(storageKey(orgId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === "string")
  } catch {
    return []
  }
}

/**
 * Persiste el set de carpetas expandidas del árbol de `/asset`, por
 * organización (`wisecore:tree-expanded:<orgId>`).
 *
 * Expuesto como ref (no state): `NavKnowledgeContent.handleLoadChildren` es un
 * callback con dependencias acotadas (`[selectedOrganizationId, t,
 * canListLibrary]`) que no debe recrearse en cada cambio de expansión — solo
 * necesita leer el valor vigente en el momento de la carga, no reaccionar a
 * sus cambios.
 *
 * `saveExpandedIds` actualiza el ref primero: si `localStorage` falla (modo
 * privado, cuota excedida), la restauración sigue funcionando en memoria
 * durante la sesión — solo se pierde entre recargas de página.
 */
export function useTreeExpansionStorage(orgId: string | null | undefined) {
  const expandedIdsRef = useRef<string[]>(readStored(orgId))

  // Releer al cambiar de organización (el árbol también se remonta con
  // key={selectedOrganizationId}, pero este hook vive un nivel más arriba).
  useEffect(() => {
    expandedIdsRef.current = readStored(orgId)
  }, [orgId])

  const saveExpandedIds = useCallback((ids: string[]) => {
    const capped = ids.slice(0, MAX_EXPANDED_FOLDER_IDS)
    expandedIdsRef.current = capped
    try {
      window.localStorage.setItem(storageKey(orgId), JSON.stringify(capped))
    } catch {
      // modo privado, cuota excedida, storage deshabilitado — el ref en
      // memoria ya quedó actualizado, no hay nada más que hacer acá.
    }
  }, [orgId])

  return { expandedIdsRef, saveExpandedIds }
}
