/**
 * Handlers por defecto de `/api/v1/auth/*` (contrato de docs/sso.md §4 del backend).
 *
 * Defaults pensados para el camino feliz del login por código de UNA organización.
 * Cada test sobreescribe lo que necesite con `server.use(...)`.
 */
import { http } from 'msw'

import { backendUrl } from '@/config'
import { makeLoginToken } from '@/test/jwt'
import { activeUser, authFlow, INTERNAL_CONNECTION_ID, ORG_A_ID } from '@/test/fixtures'
import { respondApiError, respondHttp400, respondOk } from '../respond'

export const VALID_CODE = '123456'
export const VALID_HANDOFF_CODE = 'handoff-ok'

/** Códigos de handoff ya canjeados: el backend los acepta una sola vez. */
export const consumedHandoffCodes = new Set<string>()

export function loginTokenFor(overrides: Record<string, unknown> = {}): string {
  return makeLoginToken({
    sub: activeUser.id,
    email: activeUser.email,
    auth_type_id: INTERNAL_CONNECTION_ID,
    login_org_id: ORG_A_ID,
    ...overrides,
  })
}

export const authHandlers = [
  http.post(`${backendUrl}/auth/codes`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; purpose?: string }
    if (body.purpose === 'signup') {
      return respondOk({ auth_flow: 'signup_code', message: 'Signup code generated and sent.', expires_at: '2026-01-01T00:15:00Z' })
    }
    const email = body.email ?? ''
    if (email.endsWith('@unknown.example.com')) {
      return respondApiError(404, 'ERROR', 'User not found.', 'User not found.')
    }
    if (email.endsWith('@ratelimit.example.com')) {
      return respondApiError(429, 'RATE_LIMITED', 'Too many requests', 'Too many requests')
    }
    return respondOk(authFlow.internalCode)
  }),

  http.post(`${backendUrl}/auth/codes/verify`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; code?: string }
    if (body.code !== VALID_CODE) {
      return respondHttp400('Invalid code.')
    }
    return respondOk({ message: 'Code verified successfully.', user: activeUser, token: loginTokenFor() })
  }),

  http.post(`${backendUrl}/auth/login/select`, async ({ request }) => {
    const body = (await request.json()) as { preauth_token?: string; organization_id?: string }
    if (!body.preauth_token) {
      return respondHttp400('Pre-authentication token is required.')
    }
    return respondOk({
      message: 'Login completed.',
      user: activeUser,
      token: loginTokenFor({ login_org_id: body.organization_id }),
      organization: { id: body.organization_id, name: 'Org' },
    })
  }),

  http.post(`${backendUrl}/auth/sso/exchange`, async ({ request }) => {
    const body = (await request.json()) as { code?: string }
    const code = body.code ?? ''
    if (code !== VALID_HANDOFF_CODE || consumedHandoffCodes.has(code)) {
      return respondHttp400('The sign-in code is invalid or has expired.', 'handoff_invalid')
    }
    consumedHandoffCodes.add(code)
    return respondOk({
      message: 'Sign-in completed.',
      user: activeUser,
      token: loginTokenFor({ auth_type_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }),
      return_to: null,
    })
  }),
]
