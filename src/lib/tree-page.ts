import type { HuemulTreeLoadResult, HuemulTreeNode, HuemulTreePage } from "@/types/huemul/tree"

/**
 * Unifica lo que devuelve `onLoadChildren`: un array plano (consumidores que no
 * paginan) equivale a "todo cargado, sin más páginas". Sin `total` a propósito:
 * el contador por carpeta solo aparece donde el consumidor lo informa.
 */
export function normalizeTreePage(result: HuemulTreeLoadResult): HuemulTreePage {
  if (Array.isArray(result)) {
    return { items: result, hasMore: false, nextCursor: null }
  }
  return {
    ...result,
    nextCursor: result.hasMore ? result.nextCursor : null,
  }
}

/** Agrega `incoming` al final de `current` sin repetir ids (un cursor offset puede solapar páginas). */
export function appendUniqueNodes(current: HuemulTreeNode[], incoming: HuemulTreeNode[]): HuemulTreeNode[] {
  const seen = new Set(current.map((node) => node.id))
  return [...current, ...incoming.filter((node) => !seen.has(node.id))]
}

/** Cuántos ítems trae la próxima tanda: lo que falta si se conoce el total, el límite si no. */
export function nextBatchSize(limit: number, loaded: number, total?: number): number {
  if (total === undefined) return limit
  return Math.max(1, Math.min(limit, total - loaded))
}
