/**
 * Fase 1 del plan SSO (docs/sso-frontend.md): saneo centralizado de returnUrl.
 */
import { describe, expect, it } from 'vitest'

import { consumeReturnUrl, pathBelongsToOtherOrg, peekReturnUrl, sanitizeReturnPath, saveReturnUrl } from '@/lib/return-url'
import { ORG_A_ID, ORG_B_ID } from '@/test/fixtures'

describe('return-url', () => {
  it('acepta solo rutas relativas al frontend', () => {
    expect(sanitizeReturnPath('/org-a/asset/7?tab=1')).toBe('/org-a/asset/7?tab=1')
    expect(sanitizeReturnPath('/home')).toBe('/home')
    for (const bad of ['//evil.example.com/x', String.raw`/\evil.example.com`, 'https://evil.example.com', 'javascript:alert(1)', 'org-a/home', '/a/../b', '', null, undefined]) {
      expect(sanitizeReturnPath(bad)).toBeNull()
    }
  })

  it('no guarda destinos por defecto ni rutas de auth, y consume una sola vez', () => {
    saveReturnUrl('/')
    saveReturnUrl('/home')
    saveReturnUrl('/login')
    saveReturnUrl('/auth/sso/callback?code=x')
    expect(peekReturnUrl()).toBeNull()

    saveReturnUrl('/org-a/templates?x=1')
    expect(peekReturnUrl()).toBe('/org-a/templates?x=1')
    expect(consumeReturnUrl()).toBe('/org-a/templates?x=1')
    expect(consumeReturnUrl()).toBeNull()
  })

  it('un valor malicioso ya guardado en sessionStorage no se devuelve', () => {
    sessionStorage.setItem('returnUrl', '//evil.example.com')
    expect(consumeReturnUrl()).toBeNull()
  })

  it('pathBelongsToOtherOrg detecta rutas de otra organización', () => {
    expect(pathBelongsToOtherOrg(`/${ORG_A_ID}/asset/7`, ORG_B_ID)).toBe(true)
    expect(pathBelongsToOtherOrg(`/${ORG_B_ID}/templates?x=1`, ORG_B_ID)).toBe(false)
    expect(pathBelongsToOtherOrg(`/${ORG_B_ID.toUpperCase()}/home`, ORG_B_ID)).toBe(false)
    expect(pathBelongsToOtherOrg('/home', ORG_B_ID)).toBe(false)
    expect(pathBelongsToOtherOrg('/settings/profile', ORG_B_ID)).toBe(false)
    expect(pathBelongsToOtherOrg(null, ORG_B_ID)).toBe(false)
  })
})
