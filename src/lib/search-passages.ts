import type { SearchPassage } from "@/types/search"

/**
 * Enlace a la versión y la sección de un pasaje. No se usa `citation.url` (es absoluta y no
 * trae la sección); el scroll a `section` ya lo hace la página del activo, que acepta el id de
 * la sección o el de la section_execution.
 */
export function passageAssetPath(passage: SearchPassage): string {
  const { citation } = passage
  const params = new URLSearchParams({ execution: citation.execution_id })
  const section = citation.section_id ?? citation.section_execution_id
  if (section) params.set("section", section)
  return `/asset/${citation.document_id}?${params.toString()}`
}
