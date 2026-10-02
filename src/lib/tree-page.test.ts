import { describe, expect, it } from 'vitest'
import { appendUniqueNodes, nextBatchSize, normalizeTreePage } from '@/lib/tree-page'
import type { HuemulTreeNode } from '@/types/huemul/tree'

const node = (id: string): HuemulTreeNode => ({ id, name: id, type: 'document' })

describe('normalizeTreePage', () => {
  it('trata un array plano como todo cargado, sin total ni cursor', () => {
    const items = [node('a'), node('b')]
    expect(normalizeTreePage(items)).toEqual({ items, hasMore: false, nextCursor: null })
  })

  it('conserva total y cursor de una página con más resultados', () => {
    const page = { items: [node('a')], total: 143, hasMore: true, nextCursor: 'c2' }
    expect(normalizeTreePage(page)).toEqual(page)
  })

  it('descarta el cursor cuando hasMore es false', () => {
    const page = { items: [node('a')], hasMore: false, nextCursor: 'sobrante' }
    expect(normalizeTreePage(page).nextCursor).toBeNull()
  })
})

describe('appendUniqueNodes', () => {
  it('agrega al final sin repetir ids que un cursor offset pudo solapar', () => {
    const merged = appendUniqueNodes([node('a'), node('b')], [node('b'), node('c')])
    expect(merged.map((n) => n.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('nextBatchSize', () => {
  it('sin total usa el límite', () => {
    expect(nextBatchSize(25, 25)).toBe(25)
  })

  it('con total no promete más de lo que falta', () => {
    expect(nextBatchSize(25, 25, 143)).toBe(25)
    expect(nextBatchSize(25, 125, 143)).toBe(18)
  })

  it('nunca baja de 1', () => {
    expect(nextBatchSize(25, 143, 143)).toBe(1)
  })
})
