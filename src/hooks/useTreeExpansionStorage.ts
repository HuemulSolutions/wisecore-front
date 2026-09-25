import { useEffect, useRef } from "react"
import { useUserPreference } from "./useUserPreference"
import type { UseUserPreferenceResult } from "./useUserPreference"
import type { TreeExpandedPreference, TreeRememberExpandedPreference } from "@/types/user-preferences"

// Tope del backend para expanded_folder_ids (ver services/folders.ts) — se
// aplica también acá para no persistir más ids de los que se van a poder
// mandar de vuelta.
const MAX_EXPANDED_FOLDER_IDS = 200
// Sistemas externos no tiene equivalente de expanded_folder_ids server-side
// (ver §5 de ia context/arbol-biblioteca-activos-guide.md): la restauración
// es client-side, con un fetch por sistema expandido — un tope bajo mantiene
// eso razonable incluso en el caso extremo.
const MAX_EXTERNAL_SYSTEMS_EXPANDED_IDS = 50

const EXPANDED_KEY = "tree-expanded"
const EXTERNAL_SYSTEMS_EXPANDED_KEY = "external-systems-tree-expanded"
const REMEMBER_KEY = "tree-remember-expanded"

// Clave legacy (pre-migración a /user/preferences), solo para sembrar la
// preferencia nueva una vez y no perder lo que el usuario ya tenía guardado.
const legacyStorageKey = (orgId: string | null | undefined) => `wisecore:tree-expanded:${orgId ?? 'none'}`

function normalizeIds(raw: unknown, max: number): string[] | null {
  // Formato nuevo: { expanded: string[] }.
  if (raw && typeof raw === "object" && Array.isArray((raw as { expanded?: unknown }).expanded)) {
    raw = (raw as { expanded: unknown[] }).expanded
  }
  if (!Array.isArray(raw)) return null
  return raw.filter((id): id is string => typeof id === "string").slice(0, max)
}

function parseTreeExpanded(raw: unknown, max: number): TreeExpandedPreference | null {
  const expanded = normalizeIds(raw, max)
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
    return normalizeIds(JSON.parse(raw), MAX_EXPANDED_FOLDER_IDS)
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

/** Preferencia cruda (`useUserPreference` de un set `{ expanded: string[] }`), sin scope propio. */
function useExpandedIdsPreference(key: string, orgId: string | null | undefined, max: number) {
  return useUserPreference<TreeExpandedPreference>({
    key,
    organizationId: orgId,
    defaultValue: { expanded: [] },
    parse: (raw) => parseTreeExpanded(raw, max),
  })
}

/**
 * Envuelve una preferencia cruda de expansión con el gate del switch
 * "recordar" y el merge por cobertura (ver `onExpandedFoldersChange` en
 * types/huemul/file-tree.ts): `context.knownIds` es todo nodo persistible que
 * el árbol emisor tiene materializado ahora mismo — sin él se reemplaza el
 * set entero (correcto para el único árbol viejo que no lo manda); con él se
 * conserva cualquier id previamente guardado que este árbol no pueda dar
 * cuenta (otra página del root paginado, otro picker abierto en simultáneo,
 * otra superficie). Ver ia context/persistencia-estado-ui-guide.md §3.
 */
function useMergedExpandedIds(
  { valueRef, setValue, remove, serverDiffered }: Pick<UseUserPreferenceResult<TreeExpandedPreference>, "valueRef" | "setValue" | "remove" | "serverDiffered">,
  rememberEnabled: boolean,
  max: number,
) {
  // Ref con identidad estable — mismo idiom que activeAssetIdRef en
  // nav-knowledge.tsx. Vacío mientras `rememberEnabled` es false, sin perder
  // lo que haya guardado (se restaura al reactivar el switch).
  const expandedIdsRef = useRef<string[]>(rememberEnabled ? valueRef.current.expanded : [])
  expandedIdsRef.current = rememberEnabled ? valueRef.current.expanded : []

  const saveExpandedIds = (ids: string[], context?: { knownIds: string[] }) => {
    if (!rememberEnabled) return
    const previous = valueRef.current.expanded
    const covered = context ? new Set(context.knownIds) : null
    const kept = covered ? previous.filter((id) => !covered.has(id) && !ids.includes(id)) : []
    setValue({ expanded: [...ids, ...kept].slice(0, max) })
  }

  /** Borra el set guardado (local + servidor) — botón "olvidar carpetas guardadas". */
  const clearExpanded = () => remove()

  return { expandedIdsRef, saveExpandedIds, serverDiffered, clearExpanded }
}

/** Solo el switch "recordar carpetas expandidas" del sheet de Preferencias — reusado por ambas claves de expansión. */
export function useTreeExpansionRemember(orgId: string | null | undefined) {
  const remember = useUserPreference<TreeRememberExpandedPreference>({
    key: REMEMBER_KEY,
    organizationId: orgId,
    defaultValue: { enabled: true },
    parse: parseRememberExpanded,
  })
  return {
    rememberEnabled: remember.value.enabled,
    setRememberEnabled: (enabled: boolean) => remember.setValue({ enabled }),
  }
}

/**
 * Persiste el set de carpetas expandidas de la biblioteca de activos, por
 * organización, vía `useUserPreference` (`ia
 * context/persistencia-estado-ui-guide.md`): localStorage para pintado
 * instantáneo, servidor (`/user/preferences/tree-expanded`) para que la
 * expansión siga al usuario entre navegadores/dispositivos.
 *
 * Clave COMPARTIDA: no es solo el sidebar de `/asset` — cualquier árbol que
 * navegue la misma biblioteca (pickers de activos, selectores de carpeta
 * destino) usa esta misma preferencia, para que "las carpetas que dejé
 * abiertas" sea una sola noción sin importar por dónde se entre. Ver
 * `ia context/arbol-biblioteca-activos-guide.md`.
 *
 * El switch "recordar" (`tree-remember-expanded`, sheet de Preferencias)
 * gatea esto y también a `useExternalSystemsExpansionStorage`: con
 * `enabled: false`, `saveExpandedIds` no persiste y `expandedIdsRef` se
 * reporta vacío (el árbol sigue expandiéndose en memoria durante la sesión —
 * la carga root simplemente no pide restaurar nada), sin perder el set
 * guardado por si se reactiva.
 *
 * Expuesto como ref (no state): `NavKnowledgeContent.handleLoadChildren` es un
 * callback con dependencias acotadas (`[selectedOrganizationId, t,
 * canListLibrary]`) que no debe recrearse en cada cambio de expansión — solo
 * necesita leer el valor vigente en el momento de la carga.
 */
export function useTreeExpansionStorage(orgId: string | null | undefined) {
  const migratedOrgRef = useRef<string | null | undefined>(undefined)

  const { rememberEnabled, setRememberEnabled } = useTreeExpansionRemember(orgId)

  const expandedPref = useExpandedIdsPreference(EXPANDED_KEY, orgId, MAX_EXPANDED_FOLDER_IDS)
  const { valueRef: expandedValueRef, setValue: setExpandedValue } = expandedPref

  // Migración única de la clave vieja por org: si nunca se guardó la
  // preferencia nueva, sembrarla con lo que había en localStorage y borrar
  // la clave legacy. Corre por fuera del gate de `rememberEnabled` (una
  // migración no debe depender de que el switch esté prendido).
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

  const { expandedIdsRef, saveExpandedIds, serverDiffered, clearExpanded } =
    useMergedExpandedIds(expandedPref, rememberEnabled, MAX_EXPANDED_FOLDER_IDS)

  return {
    expandedIdsRef,
    saveExpandedIds,
    serverDiffered,
    rememberEnabled,
    setRememberEnabled,
    clearExpanded,
  }
}

/**
 * Misma mecánica que `useTreeExpansionStorage`, para el árbol de sistemas
 * externos (`/external-systems`) — jerarquía propia (sistemas → funcionalidades),
 * sin equivalente de `expanded_folder_ids` server-side, así que la
 * restauración es client-side (ver ia context/arbol-biblioteca-activos-guide.md
 * §5). Clave propia `external-systems-tree-expanded`: no comparte
 * `tree-expanded` con la biblioteca de activos — son sistemas, no carpetas,
 * y mezclarlos gastaría cupo del tope de la biblioteca sin que el backend de
 * ahí los reconozca. Reusa el mismo switch "recordar" que gobierna la
 * biblioteca — una sola preferencia para el usuario, no una por árbol.
 */
export function useExternalSystemsExpansionStorage(orgId: string | null | undefined) {
  const { rememberEnabled } = useTreeExpansionRemember(orgId)
  const pref = useExpandedIdsPreference(EXTERNAL_SYSTEMS_EXPANDED_KEY, orgId, MAX_EXTERNAL_SYSTEMS_EXPANDED_IDS)
  const { expandedIdsRef, saveExpandedIds, serverDiffered, clearExpanded } =
    useMergedExpandedIds(pref, rememberEnabled, MAX_EXTERNAL_SYSTEMS_EXPANDED_IDS)

  return { expandedIdsRef, saveExpandedIds, serverDiffered, clearExpanded }
}
