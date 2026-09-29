/**
 * Handlers por defecto de `/api/v1/auth/*` (contrato de docs/sso.md §4 del backend).
 *
 * Defaults pensados para el camino feliz del login por código de UNA organización.
 * Cada test sobreescribe lo que necesite con `server.use(...)`.
 */
import { http, type HttpHandler, type HttpResponseResolver } from 'msw'

import { backendUrl } from '@/config'
import { makeLoginToken } from '@/test/jwt'
import { activeUser, authFlow, ORG_A_ID, rootAdmin } from '@/test/fixtures'
import { respondApiError, respondHttp400, respondOk } from '../respond'

export const VALID_CODE = '123456'
export const VALID_HANDOFF_CODE = 'handoff-ok'
/** Token que devuelve el `verify` por defecto del modo administrador. */
export const ROOT_ELEVATION_TOKEN = 'elevation-token-ok'

/**
 * Endpoint solo-root (docs/sso-frontend.md §2.1): sin `X-Root-Elevation` válido responde
 * 403 `ROOT_ELEVATION_REQUIRED`, como `require_root_admin` del backend; con él, delega en
 * `resolver`.
 */
export function rootOnlyHandler(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  path: string,
  resolver: HttpResponseResolver,
): HttpHandler {
  return http[method](`${backendUrl}${path}`, (info) => {
    if (info.request.headers.get('X-Root-Elevation') !== ROOT_ELEVATION_TOKEN) {
      return respondApiError(
        403,
        'ROOT_ELEVATION_REQUIRED',
        'Root admin mode required',
        'Verify your identity with an email code to perform root admin actions.',
        `/api/v1${path}`,
      )
    }
    return resolver(info)
  })
}

/** Códigos de handoff ya canjeados: el backend los acepta una sola vez. */
export const consumedHandoffCodes = new Set<string>()

export function loginTokenFor(overrides: Record<string, unknown> = {}): string {
  return makeLoginToken({
    sub: activeUser.id,
    email: activeUser.email,
    // El login por código viaja con el autenticador fijo `internal` (no apunta a ninguna fila).
    auth_type_id: 'internal',
    login_org_id: ORG_A_ID,
    ...overrides,
  })
}

export const authHandlers = [
  // Modo administrador: camino feliz de un root activo.
  http.post(`${backendUrl}/auth/root-elevation/code`, () =>
    respondOk({ message: 'Verification code sent to your email.', email: rootAdmin.email, expires_at: '2026-01-01T00:15:00Z' }),
  ),
  http.post(`${backendUrl}/auth/root-elevation/verify`, async ({ request }) => {
    const body = (await request.json()) as { code?: string }
    if (body.code !== VALID_CODE) {
      return respondHttp400('Invalid code.')
    }
    return respondOk({ elevation_token: ROOT_ELEVATION_TOKEN, expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() })
  }),
  http.get(`${backendUrl}/auth/root-elevation/status`, () =>
    respondOk({ is_root_admin: false, elevated: false, expires_at: null }),
  ),

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
