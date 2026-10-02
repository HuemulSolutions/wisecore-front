import { describe, expect, it } from 'vitest'

import { applyOrder, buildIndexRows, moveGroup, moveIndexRow, toOrderEntries } from './collection-order'
import type { CollectionDetail, CollectionGroup, CollectionItem } from '@/types/collections'

const group = (id: string, position: number): CollectionGroup => ({ id, name: id.toUpperCase(), position })
const item = (id: string, groupId: string | null, position: number): CollectionItem => ({
  id,
  document_id: `doc-${id}`,
  group_id: groupId,
  position,
  title: id,
  internal_code: null,
  document_type_id: null,
  version: null,
})

const groups = [group('g1', 0), group('g2', 1)]
const items = [item('a', null, 0), item('b', 'g1', 0), item('c', 'g1', 1), item('d', 'g2', 0)]

describe('collection-order', () => {
  it('arma el índice: sin grupo primero y después cada grupo con sus activos', () => {
    expect(buildIndexRows(groups, items).map((row) => row.id)).toEqual(['a', 'group:g1', 'b', 'c', 'group:g2', 'd'])
  })

  it('bajar un activo a otro grupo recalcula su grupo por el encabezado de arriba', () => {
    const rows = moveIndexRow(buildIndexRows(groups, items), 'a', 'd')
    expect(toOrderEntries(rows)).toEqual([
      { item_id: 'b', group_id: 'g1' },
      { item_id: 'c', group_id: 'g1' },
      { item_id: 'd', group_id: 'g2' },
      { item_id: 'a', group_id: 'g2' },
    ])
  })

  it('soltar sobre un encabezado deja el activo como primero de ese grupo, bajando o subiendo', () => {
    const down = toOrderEntries(moveIndexRow(buildIndexRows(groups, items), 'a', 'group:g2'))
    expect(down.find((entry) => entry.item_id === 'a')).toEqual({ item_id: 'a', group_id: 'g2' })
    expect(down.map((entry) => entry.item_id)).toEqual(['b', 'c', 'a', 'd'])

    const up = toOrderEntries(moveIndexRow(buildIndexRows(groups, items), 'd', 'group:g1'))
    expect(up.map((entry) => [entry.item_id, entry.group_id])).toEqual([
      ['a', null],
      ['d', 'g1'],
      ['b', 'g1'],
      ['c', 'g1'],
    ])
  })

  it('un encabezado no se mueve y mover sobre sí mismo no cambia nada', () => {
    const rows = buildIndexRows(groups, items)
    expect(moveIndexRow(rows, 'group:g1', 'd')).toBe(rows)
    expect(moveIndexRow(rows, 'b', 'b')).toBe(rows)
  })

  it('applyOrder reposiciona los activos para el pintado optimista', () => {
    const detail = { groups, items, hidden_item_count: 0 } as unknown as CollectionDetail
    const entries = toOrderEntries(moveIndexRow(buildIndexRows(groups, items), 'c', 'b'))
    const next = applyOrder(detail, entries)
    expect(next.items.map((i) => [i.id, i.group_id, i.position])).toEqual([
      ['a', null, 0],
      ['c', 'g1', 0],
      ['b', 'g1', 1],
      ['d', 'g2', 0],
    ])
  })

  it('moveGroup intercambia con el vecino y no sale de los bordes', () => {
    expect(moveGroup(groups, 'g2', -1)).toEqual(['g2', 'g1'])
    expect(moveGroup(groups, 'g1', -1)).toBeNull()
    expect(moveGroup(groups, 'g2', 1)).toBeNull()
  })
})
