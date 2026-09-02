import { useEffect, useState } from "react"

const HIDDEN_STORAGE_KEY = "wisecore:workflow-launcher-hidden"

function readHiddenStored(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(HIDDEN_STORAGE_KEY) === "1"
  } catch {
    // modo privado u otro bloqueo de storage: se comporta como no-oculto.
    return false
  }
}

/**
 * Estado de UI del lanzador de workflows: texto en edición vs búsqueda aplicada
 * (solo `Enter` pega al backend), toggle de ocultar persistido y página del
 * panel. Los datos los pide la query del launcher: aquí no se filtra ni pagina
 * nada en cliente.
 */
export function useWorkflowLauncherState() {
  const [hidden, setHiddenState] = useState(readHiddenStored)
  const [query, setQueryState] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")
  const [panelOpen, setPanelOpen] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    try {
      window.localStorage.setItem(HIDDEN_STORAGE_KEY, hidden ? "1" : "0")
    } catch {
      // ignore storage failures (e.g. private mode)
    }
  }, [hidden])

  // La paginación vive dentro del panel: cerrarlo lo deja en la primera página.
  useEffect(() => {
    if (!panelOpen) setPage(1)
  }, [panelOpen])

  // Otra búsqueda devuelve otro listado: la página vigente ya no significa lo
  // mismo.
  useEffect(() => {
    setPage(1)
  }, [appliedQuery])

  const setHidden = (next: boolean) => setHiddenState(next)

  // Vaciar el input limpia la búsqueda al instante: quedarse con resultados
  // filtrados y el buscador en blanco se lee como un listado incompleto.
  const setQuery = (next: string) => {
    setQueryState(next)
    if (next.trim().length === 0) setAppliedQuery("")
  }

  const submitQuery = () => setAppliedQuery(query.trim())

  const clearSearch = () => {
    setQueryState("")
    setAppliedQuery("")
  }

  return {
    hidden,
    setHidden,
    query,
    setQuery,
    appliedQuery,
    submitQuery,
    clearSearch,
    panelOpen,
    setPanelOpen,
    page,
    setPage,
    hasQuery: appliedQuery.length > 0,
  }
}
