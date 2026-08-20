import { highlightMatch } from '@/lib/highlight-match';

/**
 * Pinta `text` con la primera coincidencia de `term` resaltada en `<mark>`, como
 * texto corrido dentro de un único `<span>` — nunca como fila flex, para que el
 * resaltado no parta la palabra en dos líneas/columnas.
 */
export function HighlightedText({ text, term, className }: { text: string; term: string; className?: string }) {
  const fragments = highlightMatch(text, term);
  return (
    <span className={className}>
      {fragments.map((fragment, index) =>
        fragment.matched ? (
          <mark key={index} className="rounded-[2px] bg-[#ffe9a8] text-inherit">
            {fragment.text}
          </mark>
        ) : (
          <span key={index}>{fragment.text}</span>
        )
      )}
    </span>
  );
}
