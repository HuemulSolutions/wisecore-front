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
 * de la franja (solo `Enter` pega al backend), franja contraída (persistida) y
 * apertura del diálogo «Ver todos». Los datos los pide la query del launcher:
 * aquí no se filtra ni pagina nada en cliente. El diálogo tiene su propia
 * búsqueda (`useWorkflowTemplateCatalog`).
 */
export function useWorkflowLauncherState() {
  const [hidden, setHidden] = useState(readHiddenStored)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [query, setQueryState] = useState("")
  const [appliedQuery, setAppliedQuery] = useState("")

  useEffect(() => {
    try {
      window.localStorage.setItem(HIDDEN_STORAGE_KEY, hidden ? "1" : "0")
    } catch {
      // ignore storage failures (e.g. private mode)
    }
  }, [hidden])

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
    dialogOpen,
    setDialogOpen,
    query,
    setQuery,
    appliedQuery,
    submitQuery,
    clearSearch,
    hasQuery: appliedQuery.length > 0,
  }
}
