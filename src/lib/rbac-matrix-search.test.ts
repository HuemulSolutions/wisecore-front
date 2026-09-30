/**
 * /search se gatea con search:c, el permiso que exige el backend en /search/,
 * /search/passages y /search/feedback (antes asset:l|r daba acceso a una página
 * que respondía 403).
 */
import { describe, expect, it } from 'vitest'

import { RBAC_PAGES } from '@/lib/rbac-matrix'

describe('rbac-matrix · search', () => {
  it('la ruta y la búsqueda piden search:c', () => {
    expect(RBAC_PAGES.search.routePermissions).toEqual(['search:c'])
    expect(RBAC_PAGES.search.features.performSearch).toBe('search:c')
  })

  it('la búsqueda por pasajes y el feedback usan el mismo permiso', () => {
    expect(RBAC_PAGES.search.features.searchPassages).toBe('search:c')
    expect(RBAC_PAGES.search.features.sendSearchFeedback).toBe('search:c')
  })

  it('abrir un resultado sigue pidiendo lectura de activos', () => {
    expect(RBAC_PAGES.search.features.openAsset).toEqual(['asset:r', 'asset:l'])
  })
})
