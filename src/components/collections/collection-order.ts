import type {
  CollectionDetail,
  CollectionGroup,
  CollectionItem,
  CollectionItemOrderEntry,
} from "@/types/collections"

/**
 * Filas del índice lateral: primero los activos sin grupo y después cada grupo
 * (encabezado + sus activos). Es el mismo orden que devuelve el backend y el
 * que recibe el agente.
 */
export type CollectionIndexRow =
  | { kind: "item"; id: string; item: CollectionItem }
  | { kind: "group"; id: string; group: CollectionGroup }

const groupRowId = (groupId: string) => `group:${groupId}`

export function buildIndexRows(groups: CollectionGroup[], items: CollectionItem[]): CollectionIndexRow[] {
  const rows: CollectionIndexRow[] = items
    .filter((item) => item.group_id === null)
    .map((item) => ({ kind: "item" as const, id: item.id, item }))
  for (const group of groups) {
    rows.push({ kind: "group", id: groupRowId(group.id), group })
    for (const item of items.filter((candidate) => candidate.group_id === group.id)) {
      rows.push({ kind: "item", id: item.id, item })
    }
  }
  return rows
}

/**
 * Mueve un activo a la posición de otra fila (activo o encabezado de grupo) y
 * recalcula el grupo de cada activo: el del encabezado que tenga más cerca hacia
 * arriba, o ninguno si está antes del primer grupo. Soltar sobre un encabezado
 * deja el activo como primero de ese grupo.
 */
export function moveIndexRow(rows: CollectionIndexRow[], activeId: string, overId: string): CollectionIndexRow[] {
  const from = rows.findIndex((row) => row.id === activeId)
  const over = rows.findIndex((row) => row.id === overId)
  if (from < 0 || over < 0 || from === over || rows[from].kind !== "item") return rows
  // Misma semántica que arrayMove de dnd-kit: el activo queda en el índice `to`.
  // Bajando sobre un encabezado eso ya lo deja debajo de él; subiendo, se corre
  // uno para que también quede dentro de ese grupo y no al final del anterior.
  const to = rows[over].kind === "group" && from > over ? over + 1 : over
  const next = [...rows]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** Lista plana que espera `PUT /collections/{id}/items/order`. */
export function toOrderEntries(rows: CollectionIndexRow[]): CollectionItemOrderEntry[] {
  const entries: CollectionItemOrderEntry[] = []
  let currentGroup: string | null = null
  for (const row of rows) {
    if (row.kind === "group") currentGroup = row.group.id
    else entries.push({ item_id: row.item.id, group_id: currentGroup })
  }
  return entries
}

/** Detalle con el orden nuevo, para pintar el índice antes de que responda el backend. */
export function applyOrder(detail: CollectionDetail, entries: CollectionItemOrderEntry[]): CollectionDetail {
  const byId = new Map(detail.items.map((item) => [item.id, item]))
  const positions = new Map<string | null, number>()
  const items = entries.flatMap((entry) => {
    const item = byId.get(entry.item_id)
    if (!item) return []
    const position = positions.get(entry.group_id) ?? 0
    positions.set(entry.group_id, position + 1)
    return [{ ...item, group_id: entry.group_id, position }]
  })
  return { ...detail, items: buildIndexRows(detail.groups, items).flatMap((row) => (row.kind === "item" ? [row.item] : [])) }
}

/** Ids de los grupos con uno de ellos movido un lugar hacia arriba (-1) o abajo (+1). */
export function moveGroup(groups: CollectionGroup[], groupId: string, delta: -1 | 1): string[] | null {
  const ids = groups.map((group) => group.id)
  const index = ids.indexOf(groupId)
  const target = index + delta
  if (index < 0 || target < 0 || target >= ids.length) return null
  ;[ids[index], ids[target]] = [ids[target], ids[index]]
  return ids
}
