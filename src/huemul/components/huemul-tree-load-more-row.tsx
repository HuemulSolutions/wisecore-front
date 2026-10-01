"use client"

import { useEffect, useRef } from "react"
import { Loader2, ChevronsDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface HuemulTreeLoadMoreRowProps {
  /** Texto del botón (ej. "Mostrar 25 más"). */
  label: string
  /** Progreso tenue a la derecha (ej. "25 de 143"). Se omite si no se conoce el total. */
  progress?: string
  /** Nivel de indentación de los hermanos entre los que se pinta. */
  level: number
  isLoading: boolean
  /**
   * Dispara `onLoadMore` solo al acercarse al borde visible del contenedor. Solo
   * debe pasarse en la fila del final del árbol: las intermedias se cargan con
   * clic, para que una carpeta que solo pasa por la vista no encadene cargas.
   */
  autoLoad?: boolean
  onLoadMore: () => void
}

/**
 * Fila "Mostrar más" de la paginación por nodo del árbol. Se renderiza como
 * último hijo de la carpeta (o de la raíz) con la misma indentación que sus
 * hermanos; el botón queda siempre visible como control explícito y como
 * estado de carga aunque la autocarga esté activa.
 */
export function HuemulTreeLoadMoreRow({
  label,
  progress,
  level,
  isLoading,
  autoLoad = false,
  onLoadMore,
}: HuemulTreeLoadMoreRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  // El observer se arma una vez por montaje; el callback vigente se lee por ref
  // para no desarmarlo en cada render del árbol.
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore
  const isLoadingRef = useRef(isLoading)
  isLoadingRef.current = isLoading

  useEffect(() => {
    const el = rowRef.current
    if (!autoLoad || !el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !isLoadingRef.current) {
          onLoadMoreRef.current()
        }
      },
      { root: null, rootMargin: "0px 0px 200px 0px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
    // Re-armar al terminar una carga: si la fila sigue en pantalla (la tanda
    // nueva no la empujó fuera de la vista), el observer vuelve a notificar.
  }, [autoLoad, isLoading])

  return (
    <div
      ref={rowRef}
      className={cn("relative min-w-0", level > 0 && "ml-4")}
    >
      {level > 0 && (
        <>
          <div
            className="absolute left-0 top-0 w-px bg-border"
            style={{ left: `${level * 12 - 14}px`, height: "1.25rem" }}
          />
          <div
            className="absolute top-5 w-3 h-px bg-border"
            style={{ left: `${level * 12 - 14}px` }}
          />
        </>
      )}
      <button
        type="button"
        disabled={isLoading}
        onClick={onLoadMore}
        className={cn(
          "flex w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-left text-xs text-muted-foreground",
          "transition-colors hover:cursor-pointer hover:bg-accent hover:text-foreground disabled:cursor-default disabled:hover:bg-transparent",
        )}
        style={{ paddingLeft: `${level * 12 + 6}px` }}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
        ) : (
          <ChevronsDown className="h-3 w-3 shrink-0" />
        )}
        <span className="truncate">{label}</span>
        {progress && <span className="ml-auto shrink-0 tabular-nums opacity-70">{progress}</span>}
      </button>
    </div>
  )
}
