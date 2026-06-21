import { useCallback, useEffect, useState } from "react"
import type { ViewMode } from "@/huemul/components/huemul-view-toggle"

const STORAGE_KEY = "wisecore:media-view-mode"

function readStored(): ViewMode {
  if (typeof window === "undefined") return "grid"
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === "list" || stored === "grid" ? stored : "grid"
}

/**
 * `useMediaViewMode` — persisted grid/list view preference, shared across the
 * media gallery and the media reference picker via `localStorage`.
 */
export function useMediaViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [mode, setModeState] = useState<ViewMode>(readStored)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // ignore storage failures (e.g. private mode)
    }
  }, [mode])

  const setMode = useCallback((next: ViewMode) => setModeState(next), [])

  return [mode, setMode]
}
