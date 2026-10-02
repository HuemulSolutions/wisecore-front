import { useDebounce } from "@/hooks/use-debounce"

/**
 * Texto de búsqueda con debounce (sin espacios a los costados) y si todavía hay una búsqueda en
 * camino. Un buscador está "buscando" mientras `isPending` o mientras su query muestra los datos
 * de la búsqueda anterior (`isPlaceholderData`): en ese lapso no se ofrecen resultados, para no
 * elegir algo de la búsqueda previa.
 */
export function useDebouncedSearch(query: string, delay = 300) {
  const term = query.trim()
  const debounced = useDebounce(term, delay)
  return { debounced, isPending: term !== debounced }
}
