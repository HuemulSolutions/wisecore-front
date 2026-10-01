import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Pasa a `true` la primera vez que el elemento enlazado entra (o se acerca, según
 * `rootMargin`) al viewport, y se queda en `true`. Sirve para diferir queries de
 * bloques que viven al pie de un contenido largo hasta que el usuario llega a ellos.
 *
 * Sin `IntersectionObserver` (SSR / entornos de test) devuelve `true` de inmediato
 * para no dejar el bloque sin datos.
 */
export function useInViewOnce<T extends Element>(rootMargin = "300px") {
  const [inView, setInView] = useState(() => typeof IntersectionObserver === "undefined")
  const observerRef = useRef<IntersectionObserver | null>(null)

  const ref = useCallback(
    (node: T | null) => {
      observerRef.current?.disconnect()
      observerRef.current = null
      if (!node || inView) return
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setInView(true)
            observer.disconnect()
          }
        },
        { rootMargin },
      )
      observer.observe(node)
      observerRef.current = observer
    },
    [inView, rootMargin],
  )

  useEffect(() => () => observerRef.current?.disconnect(), [])

  return [ref, inView] as const
}
