/**
 * Plan SSO frontend (docs/sso-frontend.md) · BASELINE · http-client.
 * Comportamiento actual de selección de token y manejo de errores que se conserva.
 */
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import { ApiError } from '@/types/api-error'
import { server } from '@/test/msw/server'
import { respondApiError, respondLegacyError } from '@/test/msw/respond'

function captureHeaders(path: string, method: 'get' | 'post' = 'get') {
  const seen: { authorization: string | null; orgId: string | null } = { authorization: null, orgId: null }
  server.use(
    http[method](`${backendUrl}${path}`, ({ request }) => {
      seen.authorization = request.headers.get('Authorization')
      seen.orgId = request.headers.get('X-Org-Id')
      return HttpResponse.json({ data: {} })
    }),
  )
  return seen
}

describe('httpClient · selección de token por URL', () => {
  it('URLs con /auth/ usan el login token y NO mandan X-Org-Id', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const seen = captureHeaders('/auth/codes', 'post')

    await httpClient.post(`${backendUrl}/auth/codes`, { email: 'a@example.com' })

    expect(seen.authorization).toBe('Bearer login-token')
    expect(seen.orgId).toBeNull()
  })

  it('/user_roles/user_token usa el login token y respeta el X-Org-Id explícito', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const seen = captureHeaders('/user_roles/user_token', 'post')

    await httpClient.post(`${backendUrl}/user_roles/user_token`, null, { headers: { 'X-Org-Id': 'org-2' } })

    expect(seen.authorization).toBe('Bearer login-token')
    expect(seen.orgId).toBe('org-2')
  })

  it('endpoints org-scoped usan el org token y agregan X-Org-Id', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const seen = captureHeaders('/documents/')

    await httpClient.get(`${backendUrl}/documents/`)

    expect(seen.authorization).toBe('Bearer org-token')
    expect(seen.orgId).toBe('org-1')
  })

  it('sin org token, los endpoints org-scoped caen al login token (root admin en Global Admin)', async () => {
    httpClient.setLoginToken('login-token')
    const seen = captureHeaders('/documents/')

    await httpClient.get(`${backendUrl}/documents/`)

    expect(seen.authorization).toBe('Bearer login-token')
  })

  it('/organizations/{org activa}/... usa el org token (el backend lee is_org_admin de ahí)', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const seen = captureHeaders('/organizations/org-1/users')

    await httpClient.get(`${backendUrl}/organizations/org-1/users`)

    expect(seen.authorization).toBe('Bearer org-token')
    expect(seen.orgId).toBe('org-1')
  })

  it('/organizations y /organizations/{otra org}/... siguen con el login token (root admin cross-org)', async () => {
    httpClient.setLoginToken('login-token')
    httpClient.setOrganizationToken('org-token')
    httpClient.setOrganizationId('org-1')
    const list = captureHeaders('/organizations')
    await httpClient.get(`${backendUrl}/organizations`)
    expect(list.authorization).toBe('Bearer login-token')

    const other = captureHeaders('/organizations/org-2/users')
    await httpClient.get(`${backendUrl}/organizations/org-2/users`, { headers: { 'X-Org-Id': 'org-2' } })
    expect(other.authorization).toBe('Bearer login-token')
  })
})

describe('httpClient · errores', () => {
  it('401 real dispara onUnauthorized y marca el ApiError como handled', async () => {
    const onUnauthorized = vi.fn()
    httpClient.setOnUnauthorized(onUnauthorized)
    server.use(http.get(`${backendUrl}/documents/`, () => respondApiError(401, 'UNAUTHORIZED', 'Token expired', 'Token expired')))

    const error = await httpClient.get(`${backendUrl}/documents/`).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).handled).toBe(true)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('401 de permisos (FORBIDDEN) NO cierra sesión', async () => {
    const onUnauthorized = vi.fn()
    httpClient.setOnUnauthorized(onUnauthorized)
    server.use(http.get(`${backendUrl}/documents/`, () => respondApiError(401, 'FORBIDDEN', 'No role', 'no permission')))

    await expect(httpClient.get(`${backendUrl}/documents/`)).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('403 no llama a onUnauthorized y expone code/detail', async () => {
    const onUnauthorized = vi.fn()
    httpClient.setOnUnauthorized(onUnauthorized)
    server.use(
      http.post(`${backendUrl}/user_roles/user_token`, () =>
        respondApiError(403, 'AUTH_METHOD_REQUIRED', 'Method required', { required_auth_flow: { auth_flow: 'sso' } }),
      ),
    )

    const error = (await httpClient.post(`${backendUrl}/user_roles/user_token`).catch((e: unknown) => e)) as ApiError

    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(error.code).toBe('AUTH_METHOD_REQUIRED')
    expect(error.statusCode).toBe(403)
    // `detail` objeto se serializa a string: los consumidores usan parseErrorDetail.
    expect(JSON.parse(error.detail)).toEqual({ required_auth_flow: { auth_flow: 'sso' } })
  })

  it('un body de error no estándar produce un Error genérico con el mensaje', async () => {
    server.use(http.get(`${backendUrl}/documents/`, () => respondLegacyError(500, { message: 'boom' })))

    const error = await httpClient.get(`${backendUrl}/documents/`).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiError)
    expect((error as Error).message).toBe('boom')
  })

  it('agrega Content-Type JSON cuando hay body', async () => {
    let contentType: string | null = null
    server.use(
      http.post(`${backendUrl}/auth/codes`, ({ request }) => {
        contentType = request.headers.get('Content-Type')
        return HttpResponse.json({ data: {} })
      }),
    )

    await httpClient.post(`${backendUrl}/auth/codes`, { email: 'a@example.com' })

    expect(contentType).toBe('application/json')
  })
})
