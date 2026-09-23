import type { WorkflowTemplateItem } from "@/types/templates"

/**
 * Orden del lanzador: destacados (`is_top_pick`) primero y, dentro de cada
 * grupo, por `orden` ascendente. Los que no traen `orden` van al final del grupo.
 * Estable: no muta el arreglo recibido.
 */
export function sortLaunchTemplates(items: WorkflowTemplateItem[]): WorkflowTemplateItem[] {
  return [...items].sort((a, b) => {
    const topDiff = Number(!!b.is_top_pick) - Number(!!a.is_top_pick)
    if (topDiff !== 0) return topDiff
    return (a.orden ?? Number.MAX_SAFE_INTEGER) - (b.orden ?? Number.MAX_SAFE_INTEGER)
  })
}

/** El mismo template se repite por relación: el título visible prefiere la relación. */
export function templateTitle(item: WorkflowTemplateItem): string {
  return item.relation_name || item.name
}

/** El mismo template aparece una vez por relación: el id solo no identifica el chip/fila. */
export function templateKey(item: WorkflowTemplateItem): string {
  return `${item.id}-${item.document_type_id}-${item.relation_name ?? ""}`
}
