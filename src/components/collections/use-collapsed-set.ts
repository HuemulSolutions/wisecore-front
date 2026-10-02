import { useCallback, useEffect, useState } from "react"

function read(storageKey: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(storageKey)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [])
  } catch {
    return new Set()
  }
}

/**
 * Ids colapsados del índice de una colección (grupos y sub-colecciones), recordados en este
 * navegador. Todo empieza expandido; si `localStorage` no está disponible, el estado vive solo
 * en memoria. Mismo patrón que `useColumnWidths`.
 */
export function useCollapsedSet(storageKey: string) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => read(storageKey))

  useEffect(() => {
    setCollapsed(read(storageKey))
  }, [storageKey])

  const toggle = useCallback(
    (id: string) => {
      setCollapsed((previous) => {
        const next = new Set(previous)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        try {
          window.localStorage.setItem(storageKey, JSON.stringify([...next]))
        } catch {
          // Sin almacenamiento (modo privado, cuota): queda en memoria.
        }
        return next
      })
    },
    [storageKey],
  )

  return { collapsed, toggle }
}
