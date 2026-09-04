import { useEffect, useRef } from "react"
import { useUserPreference } from "./useUserPreference"
import type { TreeExpandedPreference, TreeRememberExpandedPreference } from "@/types/user-preferences"

// Tope del backend para expanded_folder_ids (ver services/folders.ts) — se
// aplica también acá para no persistir más ids de los que se van a poder
// mandar de vuelta.
const MAX_EXPANDED_FOLDER_IDS = 200

const EXPANDED_KEY = "tree-expanded"
const REMEMBER_KEY = "tree-remember-expanded"

// Clave legacy (pre-migración a /user/preferences), solo para sembrar la
// preferencia nueva una vez y no perder lo que el usuario ya tenía guardado.
const legacyStorageKey = (orgId: string | null | undefined) => `wisecore:tree-expanded:${orgId ?? 'none'}`

function normalizeIds(raw: unknown): string[] | null {
  // Formato nuevo: { expanded: string[] }.
  if (raw && typeof raw === "object" && Array.isArray((raw as { expanded?: unknown }).expanded)) {
    raw = (raw as { expanded: unknown[] }).expanded
  }
  if (!Array.isArray(raw)) return null
  return raw.filter((id): id is string => typeof id === "string").slice(0, MAX_EXPANDED_FOLDER_IDS)
}

function parseTreeExpanded(raw: unknown): TreeExpandedPreference | null {
  const expanded = normalizeIds(raw)
  return expanded ? { expanded } : null
}

function parseRememberExpanded(raw: unknown): TreeRememberExpandedPreference | null {
  if (!raw || typeof raw !== "object" || typeof (raw as { enabled?: unknown }).enabled !== "boolean") return null
  return { enabled: (raw as { enabled: boolean }).enabled }
}

function readLegacy(orgId: string | null | undefined): string[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(legacyStorageKey(orgId))
    if (!raw) return null
    return normalizeIds(JSON.parse(raw))
  } catch {
    return null
  }
}

function clearLegacy(orgId: string | null | undefined) {
  try {
    window.localStorage.removeItem(legacyStorageKey(orgId))
  } catch {
    // sin storage disponible — nada que limpiar.
  }
}

/**
 * Persiste el set de carpetas expandidas del árbol de `/asset`, por
 * organización, vía `useUserPreference` (`ia
 * context/persistencia-estado-ui-guide.md`): localStorage para pintado
 * instantáneo, servidor (`/user/preferences/tree-expanded`) para que la
 * expansión siga al usuario entre navegadores/dispositivos.
 *
 * Un segundo `useUserPreference` (`tree-remember-expanded`, switch del sheet
 * de Preferencias) gatea todo esto: con `enabled: false`, `saveExpandedIds`
 * no persiste y `expandedIdsRef` se reporta vacío (el árbol sigue
 * expandiéndose en memoria durante la sesión — la carga root simplemente no
 * pide restaurar nada), sin perder el set guardado por si se reactiva.
 *
 * Expuesto como ref (no state): `NavKnowledgeContent.handleLoadChildren` es un
 * callback con dependencias acotadas (`[selectedOrganizationId, t,
 * canListLibrary]`) que no debe recrearse en cada cambio de expansión — solo
 * necesita leer el valor vigente en el momento de la carga.
 */
export function useTreeExpansionStorage(orgId: string | null | undefined) {
  const migratedOrgRef = useRef<string | null | undefined>(undefined)

  const remember = useUserPreference<TreeRememberExpandedPreference>({
    key: REMEMBER_KEY,
    organizationId: orgId,
    defaultValue: { enabled: true },
    parse: parseRememberExpanded,
  })
  const rememberEnabled = remember.value.enabled

  const {
    valueRef: expandedValueRef,
    setValue: setExpandedValue,
    remove: removeExpanded,
    serverDiffered,
  } = useUserPreference<TreeExpandedPreference>({
    key: EXPANDED_KEY,
    organizationId: orgId,
    defaultValue: { expanded: [] },
    parse: parseTreeExpanded,
  })

  // Migración única de la clave vieja por org: si nunca se guardó la
  // preferencia nueva, sembrarla con lo que había en localStorage y borrar
  // la clave legacy.
  useEffect(() => {
    if (migratedOrgRef.current === orgId) return
    migratedOrgRef.current = orgId

    if (expandedValueRef.current.expanded.length > 0) {
      clearLegacy(orgId)
      return
    }
    const legacy = readLegacy(orgId)
    if (legacy && legacy.length > 0) {
      setExpandedValue({ expanded: legacy })
    }
    clearLegacy(orgId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId])

  // Ref con identidad estable — mismo idiom que activeAssetIdRef en
  // nav-knowledge.tsx. Vacío mientras `rememberEnabled` es false, sin perder
  // lo que haya guardado (se restaura al reactivar el switch).
  const expandedIdsRef = useRef<string[]>(rememberEnabled ? expandedValueRef.current.expanded : [])
  expandedIdsRef.current = rememberEnabled ? expandedValueRef.current.expanded : []

  const saveExpandedIds = (ids: string[]) => {
    if (!rememberEnabled) return
    setExpandedValue({ expanded: ids.slice(0, MAX_EXPANDED_FOLDER_IDS) })
  }

  const setRememberEnabled = (enabled: boolean) => remember.setValue({ enabled })

  /** Borra el set guardado (local + servidor) — botón "olvidar carpetas guardadas". */
  const clearExpanded = () => removeExpanded()

  return {
    expandedIdsRef,
    saveExpandedIds,
    serverDiffered,
    rememberEnabled,
    setRememberEnabled,
    clearExpanded,
  }
}
