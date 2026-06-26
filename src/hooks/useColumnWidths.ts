import { useCallback, useEffect, useMemo, useState } from "react"
import type { HuemulTableColumn } from "@/types/huemul"

/** Ancho por defecto (px) para columnas sin `defaultWidth` definido. */
const FALLBACK_WIDTH = 160

type WidthMap = Record<string, number>

function readStored(storageKey?: string): WidthMap {
  if (!storageKey || typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    // Conservar solo entradas numéricas válidas.
    const out: WidthMap = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

/**
 * `useColumnWidths` — estado de anchos por columna (px) con persistencia opcional
 * en `localStorage`. Sigue el patrón de `useMediaViewMode`.
 *
 * Combina los anchos guardados con los `defaultWidth` de las columnas, de modo que
 * columnas nuevas o sin valor guardado obtienen su ancho inicial, e ignora claves
 * de columnas que ya no existen.
 */
export function useColumnWidths<T>(
  columns: HuemulTableColumn<T>[],
  storageKey?: string,
) {
  // Mapa base de defaults derivado de las columnas actuales.
  const defaults = useMemo<WidthMap>(() => {
    const out: WidthMap = {}
    for (const col of columns) out[col.key] = col.defaultWidth ?? FALLBACK_WIDTH
    return out
  }, [columns])

  const [overrides, setOverrides] = useState<WidthMap>(() => readStored(storageKey))

  // Anchos efectivos: default de la columna, sobrescrito por lo guardado/arrastrado.
  const widths = useMemo<WidthMap>(() => {
    const out: WidthMap = { ...defaults }
    for (const col of columns) {
      const stored = overrides[col.key]
      if (typeof stored === "number" && Number.isFinite(stored)) out[col.key] = stored
    }
    return out
  }, [defaults, overrides, columns])

  // Persistir solo las claves de columnas vigentes (descarta huérfanas).
  useEffect(() => {
    if (!storageKey) return
    try {
      const toPersist: WidthMap = {}
      for (const col of columns) {
        const stored = overrides[col.key]
        if (typeof stored === "number" && Number.isFinite(stored)) toPersist[col.key] = stored
      }
      window.localStorage.setItem(storageKey, JSON.stringify(toPersist))
    } catch {
      // ignorar fallos de almacenamiento (p. ej. modo privado)
    }
  }, [overrides, columns, storageKey])

  const setWidth = useCallback((key: string, width: number) => {
    setOverrides((prev) => ({ ...prev, [key]: width }))
  }, [])

  const getWidth = useCallback((key: string): number => widths[key] ?? FALLBACK_WIDTH, [widths])

  return { widths, setWidth, getWidth }
}
