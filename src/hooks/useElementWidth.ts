import { useCallback, useLayoutEffect, useState } from "react"

/**
 * Ancho en píxeles de un elemento, actualizado con `ResizeObserver`.
 *
 * Usa un callback ref (en vez de `useRef`) porque si el nodo se remonta el
 * efecto debe volver a engancharse al nodo vivo — mismo patrón que
 * `HuemulExpandableText` (`huemul-expandable-text.tsx`).
 */
export function useElementWidth<T extends HTMLElement>(): { ref: (el: T | null) => void; width: number } {
  const [el, setEl] = useState<T | null>(null)
  const [width, setWidth] = useState(0)

  const ref = useCallback((node: T | null) => {
    setEl(node)
  }, [])

  useLayoutEffect(() => {
    if (!el) return

    const measure = () => setWidth(el.getBoundingClientRect().width)
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [el])

  return { ref, width }
}
