import * as React from "react"

import { cn } from "@/lib/utils"
import { useOverflowTitle } from "@/hooks/useOverflowTitle"
import type { HuemulTruncatedTextProps } from "@/types/huemul"
export type { HuemulTruncatedTextProps } from "@/types/huemul"

// Mapa estático: Tailwind v4 no genera clases construidas en runtime como
// `line-clamp-${n}`.
const CLAMP_CLASS = {
  1: "truncate",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
} as const

/**
 * Texto recortado que expone su contenido completo en el `title` nativo
 * SOLO cuando hay recorte real. Ver `ia context/tooltip-guide.md`.
 */
export function HuemulTruncatedText({
  text,
  as: Tag = "span",
  lines = 1,
  title,
  className,
  ...props
}: HuemulTruncatedTextProps) {
  const { ref, title: overflowTitle } = useOverflowTitle<HTMLElement>(title ?? text)
  // `Tag` es dinámico (span/p/div/h1..h4): cada elemento intrínseco tiene un tipo
  // de ref distinto e incompatible entre sí, así que el callback ref se acepta
  // como `any` acá — sigue siendo un `HTMLElement` real en runtime.
  const Component = Tag as React.ElementType

  return (
    <Component
      ref={ref}
      title={overflowTitle}
      className={cn(CLAMP_CLASS[lines], className)}
      {...props}
    >
      {text}
    </Component>
  )
}
