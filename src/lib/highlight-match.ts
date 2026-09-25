export interface HighlightFragment {
  text: string;
  matched: boolean;
}

/**
 * Parte `text` en fragmentos alrededor de la primera coincidencia (case-insensitive,
 * sin acentos) de `term`, para pintar `<mark>` inline sin romper el texto en un
 * contenedor flex — el llamador debe renderizar los fragmentos dentro de un único
 * `<span>` de texto corrido, nunca en filas/columnas separadas.
 */
export function highlightMatch(text: string, term: string): HighlightFragment[] {
  const trimmed = term.trim();
  if (!trimmed) return [{ text, matched: false }];

  const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const haystack = normalize(text);
  const needle = normalize(trimmed);
  const index = haystack.indexOf(needle);
  if (index === -1) return [{ text, matched: false }];

  return [
    { text: text.slice(0, index), matched: false },
    { text: text.slice(index, index + needle.length), matched: true },
    { text: text.slice(index + needle.length), matched: false },
  ].filter((fragment) => fragment.text.length > 0);
}
