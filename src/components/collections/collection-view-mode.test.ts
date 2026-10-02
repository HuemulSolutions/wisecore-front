import { describe, expect, it } from 'vitest'

import { buildCollectionModeUrl, resolveViewMode, viewModeParam } from './collection-view-mode'

describe('collection-view-mode', () => {
  it('sin modo, quien administra entra en Diseño y el resto en Consulta', () => {
    expect(resolveViewMode(null, true)).toBe('edit')
    expect(resolveViewMode(null, false)).toBe('view_only')
  })

  it('Diseño solo vale para quien administra; si no, Consulta', () => {
    expect(resolveViewMode('design', true)).toBe('edit')
    expect(resolveViewMode('design', false)).toBe('view_only')
  })

  it('Elaborador y Consulta valen para todos, también con los valores de los primeros links', () => {
    for (const canAdmin of [true, false]) {
      expect(resolveViewMode('author', canAdmin)).toBe('reader')
      expect(resolveViewMode('reader', canAdmin)).toBe('reader')
      expect(resolveViewMode('consult', canAdmin)).toBe('view_only')
      expect(resolveViewMode('view_only', canAdmin)).toBe('view_only')
    }
  })

  it('el link lleva el modo y conserva lo que se está viendo', () => {
    expect(viewModeParam('edit')).toBe('design')
    const url = new URL(buildCollectionModeUrl('https://app.test/org/collections/c1?item=i1&in=c2&view=design', 'view_only'))
    expect(url.pathname).toBe('/org/collections/c1')
    expect(Object.fromEntries(url.searchParams)).toEqual({ item: 'i1', in: 'c2', view: 'consult' })
  })
})
