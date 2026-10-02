/**
 * `classic`: /search/, el buscador anterior. `advanced`: /search/passages sin LLM (el default).
 * `deep`: /search/passages con `high_precision`, reordenado por el LLM de rerank.
 */
export type SearchMode = "classic" | "advanced" | "deep";
/** Presentación de los modos por pasajes: la lista de fragmentos o una tarjeta por activo. */
export type PassageDisplay = "passage" | "asset";

export const PASSAGES_PAGE_SIZE = 12;
/** Agrupado se piden más pasajes, para que cada activo junte más de un fragmento. */
export const GROUPED_PAGE_SIZE = 30;

/**
 * Modo desde la URL. Enlaces anteriores: `view=passages` es la Avanzada y con
 * `high_precision=true` la Profunda; sin `mode` ni `view` se abre la Avanzada.
 */
export function parseModeFromURL(params: URLSearchParams): SearchMode {
  const mode = params.get("mode");
  if (mode === "classic" || mode === "advanced" || mode === "deep") return mode;
  if (params.get("view") === "passages" && params.get("high_precision") === "true") return "deep";
  return "advanced";
}

export function parseDisplayFromURL(params: URLSearchParams): PassageDisplay {
  return params.get("group") === "asset" ? "asset" : "passage";
}
