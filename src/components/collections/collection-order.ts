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

export const groupRowId = (groupId: string) => `group:${groupId}`

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
 * Filas que se ven: sin los ítems de un grupo colapsado (`collapsed` tiene el id de la fila del
 * grupo). El orden que se guarda se sigue armando con todas las filas, así los ítems ocultos
 * conservan su lugar.
 */
export function visibleIndexRows(rows: CollectionIndexRow[], collapsed: ReadonlySet<string>): CollectionIndexRow[] {
  let hidden = false
  return rows.filter((row) => {
    if (row.kind === "group") {
      hidden = collapsed.has(row.id)
      return true
    }
    return !hidden || row.item.group_id === null
  })
}

/**
 * Nuevo orden de los grupos al soltar el encabezado `activeId` sobre la fila `overId`: el grupo
 * toma el lugar del grupo de esa fila (el encabezado mismo o el grupo del ítem). Soltar sobre un
 * ítem sin grupo lo deja primero: los ítems sin grupo siempre van antes de los grupos. `null` si
 * no cambia nada.
 */
export function moveGroupRow(rows: CollectionIndexRow[], activeId: string, overId: string): string[] | null {
  const groupIds = rows.flatMap((row) => (row.kind === "group" ? [row.group.id] : []))
  const active = rows.find((row) => row.id === activeId)
  const over = rows.find((row) => row.id === overId)
  if (!active || active.kind !== "group" || !over) return null
  const targetGroupId = over.kind === "group" ? over.group.id : over.item.group_id
  const from = groupIds.indexOf(active.group.id)
  const to = targetGroupId === null ? 0 : groupIds.indexOf(targetGroupId)
  if (from < 0 || to < 0 || from === to) return null
  const next = [...groupIds]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
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

