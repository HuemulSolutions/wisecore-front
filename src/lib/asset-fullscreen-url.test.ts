import { describe, expect, it } from 'vitest'

import { buildAssetFullscreenPath, resolveFullscreenReturn } from './asset-fullscreen-url'

const ORG = '11111111-1111-1111-1111-111111111111'
const OTHER = '22222222-2222-2222-2222-222222222222'

describe('asset-fullscreen-url', () => {
  it('arma la ruta con versión y vuelta codificada', () => {
    expect(buildAssetFullscreenPath('a1')).toBe('/asset/full/a1')
    expect(buildAssetFullscreenPath('a1', { executionId: 'e1' })).toBe('/asset/full/a1?execution=e1')
    const path = buildAssetFullscreenPath('a1', { executionId: 'e1', returnTo: `/${ORG}/collections/c1?item=i1` })
    expect(new URLSearchParams(path.split('?')[1]).get('return')).toBe(`/${ORG}/collections/c1?item=i1`)
  })

  it('vuelve a la pantalla que la abrió, o a /asset si la vuelta no es segura', () => {
    expect(resolveFullscreenReturn(`/${ORG}/collections/c1?item=i1`, ORG, 'a1')).toBe(`/${ORG}/collections/c1?item=i1`)
    expect(resolveFullscreenReturn(null, ORG, 'a1')).toBe('/asset/a1')
    expect(resolveFullscreenReturn('//evil.com/x', ORG, 'a1')).toBe('/asset/a1')
    expect(resolveFullscreenReturn('https://evil.com', ORG, 'a1')).toBe('/asset/a1')
    expect(resolveFullscreenReturn(`/${OTHER}/collections/c1`, ORG, 'a1')).toBe('/asset/a1')
  })

  it('conserva la sub-colección del activo (?in=) al volver', () => {
    const back = `/${ORG}/collections/c1?item=i1&in=c2`
    const path = buildAssetFullscreenPath('a1', { executionId: 'e1', returnTo: back })
    const returnTo = new URLSearchParams(path.split('?')[1]).get('return')
    expect(returnTo).toBe(back)
    expect(resolveFullscreenReturn(returnTo, ORG, 'a1')).toBe(back)
  })
})
