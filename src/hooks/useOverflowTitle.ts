import { useCallback, useLayoutEffect, useState } from "react"

/**
 * Devuelve un `title` nativo solo cuando el nodo realmente recorta su contenido.
 *
 * Cubre los dos modos de recorte del proyecto:
 * - horizontal (`truncate`)    → `scrollWidth > clientWidth`
 * - vertical (`line-clamp-N`) → `scrollHeight > clientHeight`
 *
 * Usa un callback ref (en vez de `useRef`) para que el efecto se reenganche si el
 * nodo se remonta — mismo patrón que `useElementWidth.ts` y `HuemulExpandableText`
 * (`huemul-expandable-text.tsx:68-71`). Ver `ia context/tooltip-guide.md`.
 */
export function useOverflowTitle<T extends HTMLElement>(
  text: string | null | undefined,
): { ref: (el: T | null) => void; title: string | undefined; isOverflowing: boolean } {
  const [el, setEl] = useState<T | null>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  const ref = useCallback((node: T | null) => {
    setEl(node)
  }, [])

  useLayoutEffect(() => {
    if (!el) return

    const measure = () => {
      // +1px de tolerancia: con anchos fraccionarios o zoom del navegador,
      // scrollWidth puede superar a clientWidth por redondeo sin recorte real.
      const overflows =
        el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1
      // Solo re-renderiza si el valor cambió: setear `title` no altera el layout,
      // así que no hay riesgo de bucle con el ResizeObserver.
      setIsOverflowing((prev) => (prev === overflows ? prev : overflows))
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(el)
    // Un nodo `inline` dentro de un flex con `min-w-0` puede no cambiar su propio
    // border-box cuando el contenedor se angosta: observar al padre cubre ese caso.
    if (el.parentElement) observer.observe(el.parentElement)

    // Las webfonts cambian las métricas después del primer layout: una remedición
    // al resolverse evita falsos negativos en el primer render.
    let cancelled = false
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure()
    })

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [el, text])

  return { ref, title: isOverflowing && text ? text : undefined, isOverflowing }
}
