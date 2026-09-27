import { useRef } from "react"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPreference } from "./useUserPreference"
import type { ViewMode } from "@/huemul/components/huemul-view-toggle"
import type { MediaViewModePreference } from "@/types/user-preferences"

const PREF_KEY = "media-view-mode"

// Clave legacy (pre-migración a /user/preferences) — era GLOBAL, sin scoping
// por org; la preferencia nueva sí escala por org (mismo scope que el
// backend, X-Org-Id). No se puede "consumir una vez" como con tree-expanded
// porque distintas orgs del mismo usuario todavía no tienen su propia clave
// nueva — se deja como fallback de lectura permanente, sin borrarla.
const LEGACY_STORAGE_KEY = "wisecore:media-view-mode"

function parseMediaViewMode(raw: unknown): MediaViewModePreference | null {
  if (raw && typeof raw === "object" && (raw as { mode?: unknown }).mode) {
    const mode = (raw as { mode?: unknown }).mode
    return mode === "list" || mode === "grid" ? { mode } : null
  }
  // Formato legacy: string pelado ("grid" | "list").
  return raw === "list" || raw === "grid" ? { mode: raw } : null
}

function readLegacy(): MediaViewModePreference | null {
  if (typeof window === "undefined") return null
  try {
    return parseMediaViewMode(window.localStorage.getItem(LEGACY_STORAGE_KEY))
  } catch {
    return null
  }
}

/**
 * `useMediaViewMode` — preferencia de vista grid/list de las galerías de
 * media, compartida por la galería, el tab de media de templates y el
 * picker de referencias. Vía `useUserPreference`: localStorage para pintado
 * instantáneo, servidor (`/user/preferences/media-view-mode`) para que la
 * elección siga al usuario entre dispositivos.
 */
export function useMediaViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const { selectedOrganizationId } = useOrganization()
  // Leído una sola vez: identidad estable para no recrear callbacks del hook
  // genérico en cada render (ver `remove` en useUserPreference).
  const defaultValueRef = useRef<MediaViewModePreference | undefined>(undefined)
  if (!defaultValueRef.current) defaultValueRef.current = readLegacy() ?? { mode: "grid" }

  const { value, setValue } = useUserPreference<MediaViewModePreference>({
    key: PREF_KEY,
    organizationId: selectedOrganizationId,
    defaultValue: defaultValueRef.current,
    parse: parseMediaViewMode,
  })

  const setMode = (next: ViewMode) => setValue({ mode: next })

  return [value.mode, setMode]
}
