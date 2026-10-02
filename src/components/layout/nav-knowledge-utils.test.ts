import { describe, expect, it } from 'vitest'
import { encodePageCursor, parsePageCursor, toTreePage } from '@/components/layout/nav-knowledge-utils'
import type { LibraryContent } from '@/types/folders'

const content = (extra: Partial<LibraryContent> = {}): LibraryContent => ({
  folders: [],
  assets: [],
  has_next: false,
  ...extra,
})

describe('parsePageCursor', () => {
  it('sin cursor es la primera página con el tamaño pedido', () => {
    expect(parsePageCursor(null, 25)).toEqual({ page: 1, pageSize: 25 })
    expect(parsePageCursor(undefined, 25)).toEqual({ page: 1, pageSize: 25 })
  })

  it('decodifica el cursor de respaldo página:tamaño', () => {
    expect(parsePageCursor(encodePageCursor(3, 1000), 25)).toEqual({ page: 3, pageSize: 1000 })
  })

  it('un cursor que no es de respaldo se trata como opaco del backend', () => {
    expect(parsePageCursor('eyJuYW1lIjoiRm9ybSJ9', 25)).toEqual({
      page: 1,
      pageSize: 25,
      opaque: 'eyJuYW1lIjoiRm9ybSJ9',
    })
  })
})

describe('toTreePage', () => {
  it('sin next_cursor pagina por número de página según has_next', () => {
    const page = toTreePage([], content({ has_next: true }), 1, 25)
    expect(page).toMatchObject({ hasMore: true, nextCursor: '2:25', total: undefined })
  })

  it('la última página cierra sin cursor', () => {
    expect(toTreePage([], content({ has_next: false }), 4, 25)).toMatchObject({ hasMore: false, nextCursor: null })
  })

  it('prefiere el next_cursor y el total del backend', () => {
    const page = toTreePage([], content({ has_next: false, next_cursor: 'abc', total: 143 }), 1, 25)
    expect(page).toMatchObject({ hasMore: true, nextCursor: 'abc', total: 143 })
  })

  it('next_cursor null del backend cierra aunque has_next diga lo contrario', () => {
    expect(toTreePage([], content({ has_next: true, next_cursor: null }), 1, 25)).toMatchObject({
      hasMore: false,
      nextCursor: null,
    })
  })

  it('la página que sigue a una carga raíz enriquecida conserva su tamaño grande', () => {
    expect(toTreePage([], content({ has_next: true }), 1, 1000).nextCursor).toBe('2:1000')
  })
})
