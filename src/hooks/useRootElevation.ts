import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

import { rootElevationStore } from '@/lib/root-elevation-store'

/** Cada cuánto se recalculan los minutos restantes que muestra la UI. */
const TICK_MS = 30_000

/**
 * Estado del modo administrador para la UI (docs/sso-frontend.md §2.1): si está activo,
 * cuántos minutos le quedan y cómo entrar o salir. La autorización real la decide el
 * backend request por request; esto solo muestra el estado del token en memoria.
 */
export function useRootElevation() {
  const snapshot = useSyncExternalStore(rootElevationStore.subscribe, rootElevationStore.getSnapshot)
  const expiresAt = snapshot.expiresAt
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (expiresAt === null) return
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(interval)
  }, [expiresAt])

  const remainingMs = expiresAt === null ? 0 : Math.max(0, expiresAt - now)

  const enter = useCallback(() => rootElevationStore.requestElevation('manual'), [])
  const exit = useCallback(() => rootElevationStore.clear(), [])
  const require = useCallback(() => rootElevationStore.requestElevation('required'), [])

  return {
    isElevated: expiresAt !== null,
    expiresAt,
    remainingMinutes: Math.max(1, Math.ceil(remainingMs / 60_000)),
    enter,
    exit,
    /** Pide el código porque una pantalla lo necesita para cargar (p. ej. `/global-admin`). */
    require,
  }
}
