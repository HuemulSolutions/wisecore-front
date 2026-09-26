/**
 * Handlers por defecto de organizaciones, token de organización y conexiones.
 */
import { http, type HttpHandler } from 'msw'

import { backendUrl } from '@/config'
import { makeOrgToken } from '@/test/jwt'
import { activeUser, orgA, orgB, orgNotMember } from '@/test/fixtures'
import { respondApiError, respondOk } from '../respond'

export const organizationHandlers = [
  http.get(`${backendUrl}/users/organizations`, () => respondOk([orgA, orgB, orgNotMember])),

  http.post(`${backendUrl}/user_roles/user_token`, ({ request }) => {
    const orgId = request.headers.get('X-Org-Id')
    if (!orgId) {
      return respondApiError(422, 'VALIDATION_ERROR', 'X-Org-Id header is required')
    }
    return respondOk({
      token: makeOrgToken({ sub: activeUser.id, email: activeUser.email, org_id: orgId, permissions: ['asset:r'] }),
    })
  }),

  http.get(`${backendUrl}/auth_types/types`, () => respondOk(['internal', 'microsoft', 'google'])),
  http.get(`${backendUrl}/auth_types/`, () => respondOk([])),
  http.get(`${backendUrl}/auth-sso/identities/me`, () => respondOk([])),
]

/**
 * Variante 403 `AUTH_METHOD_REQUIRED` del token de organización (step-up, docs/sso.md §4.2).
 * `detail` viaja como objeto y `ApiError` lo serializa: leerlo con `parseErrorDetail`.
 */
export function authMethodRequiredHandler(required: Record<string, unknown>, onlyForOrgId?: string): HttpHandler {
  return http.post(`${backendUrl}/user_roles/user_token`, ({ request }) => {
    const orgId = request.headers.get('X-Org-Id') ?? ''
    if (onlyForOrgId && orgId !== onlyForOrgId) {
      return respondOk({ token: makeOrgToken({ sub: activeUser.id, org_id: orgId, permissions: ['asset:r'] }) })
    }
    return respondApiError(
      403,
      'AUTH_METHOD_REQUIRED',
      'This organization requires a different sign-in method',
      { message: 'Membership requires another method.', required_auth_flow: required },
      '/api/v1/user_roles/user_token',
    )
  })
}
