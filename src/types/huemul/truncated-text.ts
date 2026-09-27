import type * as React from "react"

export type HuemulTruncatedTextTag = "span" | "p" | "div" | "h1" | "h2" | "h3" | "h4"

export interface HuemulTruncatedTextProps
  extends Omit<React.ComponentProps<"span">, "title" | "children"> {
  /** Texto a mostrar y, si se recorta, contenido del `title` nativo. */
  text: string
  /** Etiqueta a renderizar. Default `span`. */
  as?: HuemulTruncatedTextTag
  /** Líneas visibles antes de recortar. 1 → `truncate`; 2..5 → `line-clamp-N`. */
  lines?: 1 | 2 | 3 | 4 | 5
  /** Texto alternativo para el `title` cuando debe decir más que `text`. */
  title?: string
}
