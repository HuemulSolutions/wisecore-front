import { useCallback, useEffect, useState } from "react"

export interface RecentDiagram {
  id: string
  name: string
}

const STORAGE_PREFIX = "wisecore:diagrams-recent"
const MAX_RECENTS = 6

function storageKey(orgId: string | null | undefined) {
  return `${STORAGE_PREFIX}:${orgId ?? 'none'}`
}

function readStored(orgId: string | null | undefined): RecentDiagram[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(storageKey(orgId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((r): r is RecentDiagram => !!r?.id && typeof r?.name === "string")
      : []
  } catch {
    return []
  }
}

/**
 * Diagramas abiertos/creados recientemente en esta organización — atajo para
 * cargarlos al canvas sin pasar por el sheet de listado. Preferencia de una
 * sola pantalla (no cross-device): localStorage simple, ver
 * `ia context/persistencia-estado-ui-guide.md` §3.
 */
export function useRecentDiagrams(organizationId: string | null | undefined) {
  const [recents, setRecents] = useState<RecentDiagram[]>(() => readStored(organizationId))

  // Cambiar de organización relee su propia lista en vez de arrastrar la anterior.
  useEffect(() => {
    setRecents(readStored(organizationId))
  }, [organizationId])

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(organizationId), JSON.stringify(recents))
    } catch {
      // modo privado / storage deshabilitado: la preferencia simplemente no persiste
    }
  }, [organizationId, recents])

  const addRecent = useCallback((diagram: RecentDiagram) => {
    setRecents((prev) => [diagram, ...prev.filter((r) => r.id !== diagram.id)].slice(0, MAX_RECENTS))
  }, [])

  const removeRecent = useCallback((id: string) => {
    setRecents((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { recents, addRecent, removeRecent } as const
}
