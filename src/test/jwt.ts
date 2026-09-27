/**
 * JWT falsos para tests. `decodeJWT` (src/lib/jwt-utils.ts) NO verifica la
 * firma, así que alcanza con `base64url(header).base64url(payload).firma-falsa`.
 */
import type { LoginTokenPayload, OrganizationTokenPayload } from '@/types/jwt-utils'

function base64url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function makeJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = base64url(JSON.stringify(payload))
  return `${header}.${body}.firma-falsa`
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

export type LoginTokenOverrides = Partial<LoginTokenPayload> & {
  auth_type_id?: string
  login_org_id?: string | null
}

export function makeLoginToken(overrides: LoginTokenOverrides = {}): string {
  return makeJwt({
    sub: '11111111-1111-1111-1111-111111111111',
    email: 'ada@example.com',
    name: 'Ada',
    last_name: 'Lovelace',
    is_root_admin: false,
    token_type: 'app',
    exp: nowSeconds() + 3600,
    ...overrides,
  })
}

export function makeOrgToken(
  overrides: Partial<OrganizationTokenPayload> & { org_id?: string } = {},
): string {
  return makeJwt({
    sub: '11111111-1111-1111-1111-111111111111',
    email: 'ada@example.com',
    roles: [],
    permissions: [],
    is_root_admin: false,
    is_org_admin: false,
    token_type: 'api_token',
    exp: nowSeconds() + 3600,
    ...overrides,
  })
}

export function makeExpiredLoginToken(): string {
  return makeLoginToken({ exp: nowSeconds() - 60 })
}
