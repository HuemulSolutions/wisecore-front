import { useRef } from "react"
import { useTreeExpansionRemember } from "./useTreeExpansionStorage"

// Mecanismo distinto al set de carpetas expandidas (árbol vs. navegador de un
// nivel con breadcrumb, ver ia context/arbol-biblioteca-activos-guide.md §6):
// clave y storage propios, localStorage simple (ia
// context/persistencia-estado-ui-guide.md §3) — no useUserPreference. Es la
// posición de navegación de un popover efímero (el `@` del editor): escribir
// al servidor por cada carpeta que el usuario abre ahí no se justifica, y no
// hay demanda cross-device sobre esto.
const MAX_TRAIL_SEGMENTS = 8

const storageKey = (orgId: string | null | undefined) => `wisecore:mention-trail:${orgId ?? "none"}`

export interface MentionTrailSegment {
  id: string
  name: string
}

function readTrail(orgId: string | null | undefined): MentionTrailSegment[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(storageKey(orgId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const segments = parsed.filter(
      (s): s is MentionTrailSegment =>
        !!s && typeof s === "object" && typeof s.id === "string" && typeof s.name === "string",
    )
    return segments.length > 0 ? segments.slice(0, MAX_TRAIL_SEGMENTS) : null
  } catch {
    return null
  }
}

function writeTrail(orgId: string | null | undefined, segments: MentionTrailSegment[]) {
  try {
    if (segments.length === 0) {
      window.localStorage.removeItem(storageKey(orgId))
      return
    }
    window.localStorage.setItem(storageKey(orgId), JSON.stringify(segments.slice(0, MAX_TRAIL_SEGMENTS)))
  } catch {
    // modo privado, cuota excedida — la sesión sigue andando en memoria.
  }
}

/** Borra el trail guardado — usado por "olvidar carpetas guardadas" en Preferencias. */
export function clearMentionTrail(orgId: string | null | undefined) {
  try {
    window.localStorage.removeItem(storageKey(orgId))
  } catch {
    // sin storage disponible — nada que limpiar.
  }
}

/**
 * Lee el trail guardado (una sola vez, al montar el popover) y expone un
 * `save` gateado por el mismo switch "recordar" que gobierna la biblioteca de
 * activos (`tree-remember-expanded`) — una sola preferencia de usuario, no
 * una por mecanismo de persistencia.
 */
export function useMentionTrailStorage(orgId: string | null | undefined) {
  const { rememberEnabled } = useTreeExpansionRemember(orgId)
  const restoredTrailRef = useRef<MentionTrailSegment[] | null>(rememberEnabled ? readTrail(orgId) : null)

  const save = (segments: MentionTrailSegment[]) => {
    if (!rememberEnabled) return
    writeTrail(orgId, segments)
  }

  return { restoredTrail: restoredTrailRef.current, save }
}
