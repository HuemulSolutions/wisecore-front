/**
 * Plan SSO frontend (docs/sso-frontend.md) · BASELINE · jwt-utils.
 */
import { describe, expect, it } from 'vitest'

import { httpClient } from '@/lib/http-client'
import { decodeJWT, getLoginTokenInfo, isOrgAdmin, isRootAdmin, isTokenExpired } from '@/lib/jwt-utils'
import { makeExpiredLoginToken, makeJwt, makeLoginToken, makeOrgToken } from '@/test/jwt'

describe('jwt-utils', () => {
  it('decodeJWT lee el payload (con padding base64) y devuelve null si el formato es inválido', () => {
    const token = makeJwt({ sub: 'u1', exp: 1 })
    expect(decodeJWT<{ sub: string }>(token)?.sub).toBe('u1')
    expect(decodeJWT('no-es-un-jwt')).toBeNull()
    expect(decodeJWT('')).toBeNull()
  })

  it('isTokenExpired compara exp con la hora actual y trata "sin exp" como expirado', () => {
    expect(isTokenExpired(makeLoginToken())).toBe(false)
    expect(isTokenExpired(makeExpiredLoginToken())).toBe(true)
    expect(isTokenExpired(makeJwt({ sub: 'u1' }))).toBe(true)
  })

  it('getLoginTokenInfo devuelve null con token expirado', () => {
    httpClient.setLoginToken(makeExpiredLoginToken())
    expect(getLoginTokenInfo()).toBeNull()
  })

  it('isRootAdmin prioriza el login token y cae al org token; isOrgAdmin solo mira el org token', () => {
    httpClient.setLoginToken(makeLoginToken({ is_root_admin: true }))
    httpClient.setOrganizationToken(makeOrgToken({ is_root_admin: false, is_org_admin: true }))
    expect(isRootAdmin()).toBe(true)
    expect(isOrgAdmin()).toBe(true)

    httpClient.setLoginToken(null)
    expect(isRootAdmin()).toBe(false)
  })

  it('los claims nuevos del plan SSO (auth_type_id, login_org_id) viajan en el payload', () => {
    const token = makeLoginToken({ auth_type_id: 'conn-1', login_org_id: 'org-1' })
    const payload = decodeJWT<{ auth_type_id: string; login_org_id: string }>(token)
    expect(payload?.auth_type_id).toBe('conn-1')
    expect(payload?.login_org_id).toBe('org-1')
  })
})
