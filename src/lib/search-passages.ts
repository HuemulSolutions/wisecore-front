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

export interface SearchPassageAssetGroup {
  documentId: string
  /** Cita del mejor pasaje del activo: nombre, código, tipo y estado de la tarjeta. */
  citation: SearchPassage["citation"]
  bestRank: number
  passages: SearchPassage[]
}

/**
 * Agrupa por activo los pasajes de una página, en el orden de su mejor pasaje. Los pasajes ya
 * vienen ordenados por `rank`, así que el primero de cada activo es el mejor y el orden de
 * aparición de los activos es el del ranking.
 */
export function groupPassagesByAsset(passages: SearchPassage[]): SearchPassageAssetGroup[] {
  const groups = new Map<string, SearchPassageAssetGroup>()
  for (const passage of [...passages].sort((a, b) => a.rank - b.rank)) {
    const documentId = passage.citation.document_id
    const group = groups.get(documentId)
    if (group) group.passages.push(passage)
    else groups.set(documentId, { documentId, citation: passage.citation, bestRank: passage.rank, passages: [passage] })
  }
  return [...groups.values()]
}
