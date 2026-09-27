import { useEffect, useState } from "react"

// Breakpoints de Tailwind (sm/lg/xl) usados por grids responsive tipo
// "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4".
function getColumns(width: number): number {
  if (width >= 1280) return 4
  if (width >= 1024) return 3
  if (width >= 640) return 2
  return 1
}

// Cantidad de columnas activas de un grid responsive según el ancho de
// ventana. Útil para calcular cuántos items pedir al backend por página.
export function useGridColumns() {
  const [columns, setColumns] = useState(() =>
    typeof window === "undefined" ? 1 : getColumns(window.innerWidth),
  )

  useEffect(() => {
    const onResize = () => setColumns(getColumns(window.innerWidth))
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return columns
}
