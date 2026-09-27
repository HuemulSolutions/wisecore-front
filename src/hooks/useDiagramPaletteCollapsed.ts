import { useCallback, useState } from "react"

const STORAGE_KEY = "wisecore:diagrams-palette-collapsed"

function readStored(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

/**
 * Preferencia de UI (por navegador) del panel de elementos del canvas de
 * /diagrams: expandido (default) o tira de iconos. Sin backend: ver
 * `ia context/persistencia-estado-ui-guide.md` §3 (hook simple).
 */
export function useDiagramPaletteCollapsed(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsedState] = useState<boolean>(readStored)

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    } catch {
      // modo privado / storage deshabilitado: la preferencia simplemente no persiste
    }
  }, [])

  return [collapsed, setCollapsed]
}
