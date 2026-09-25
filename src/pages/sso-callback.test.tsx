/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 2 · `/auth/sso/callback`.
 */
import { StrictMode } from 'react'
import { http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { SsoCallbackPage, resetConsumedSsoCodes } from '@/pages/sso-callback'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondHttp400, respondOk } from '@/test/msw/respond'
import { activeUser, ORG_A_ID, ORG_B_ID } from '@/test/fixtures'
import { makeLoginToken } from '@/test/jwt'
import { VALID_HANDOFF_CODE, consumedHandoffCodes, loginTokenFor } from '@/test/msw/handlers/auth'
import { authMethodRequiredHandler } from '@/test/msw/handlers/organizations'
import { savePendingSsoState } from '@/lib/sso-redirect'

const toastSuccess = vi.fn()
vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>()
  return { ...actual, toast: { ...actual.toast, success: (...args: unknown[]) => toastSuccess(...args), error: vi.fn() } }
})

const CALLBACK = '/auth/sso/callback'

function countExchanges() {
  const counter = { calls: 0, orgTokenRequests: [] as string[] }
  server.use(
    http.post(`${backendUrl}/auth/sso/exchange`, async ({ request }) => {
      counter.calls += 1
      const body = (await request.json()) as { code: string }
      if (body.code !== VALID_HANDOFF_CODE || consumedHandoffCodes.has(body.code)) {
        return respondHttp400('invalid', 'handoff_invalid')
      }
      consumedHandoffCodes.add(body.code)
      return respondOk({ message: 'ok', user: activeUser, token: loginTokenFor(), return_to: null })
    }),
    http.post(`${backendUrl}/user_roles/user_token`, ({ request }) => {
      counter.orgTokenRequests.push(request.headers.get('X-Org-Id') ?? '')
      return respondOk({ token: makeLoginToken({ sub: activeUser.id }) })
    }),
  )
  return counter
}

async function expectLocation(path: string) {
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(path))
}

describe('SsoCallbackPage', () => {
  beforeEach(() => {
    resetConsumedSsoCodes()
    consumedHandoffCodes.clear()
    toastSuccess.mockClear()
  })

  it('canjea el code una sola vez (StrictMode), inicia sesión, pide el token de la org del token y navega a /{org}/home', async () => {
    const counter = countExchanges()
    renderWithProviders(
      <StrictMode>
        <SsoCallbackPage />
      </StrictMode>,
      { route: `${CALLBACK}?code=${VALID_HANDOFF_CODE}`, withRoutes: true },
    )

    await expectLocation(`/${ORG_A_ID}/home`)
    expect(counter.calls).toBe(1)
    expect(counter.orgTokenRequests).toEqual([ORG_A_ID])
    expect(localStorage.getItem('auth_token')).toBeTruthy()
    expect(localStorage.getItem('selectedOrganizationId')).toBe(ORG_A_ID)
    expect(localStorage.getItem('organizationToken')).toBeTruthy()
  })

  it('respeta return_to relativo y quita el code de la URL', async () => {
    countExchanges()
    renderWithProviders(<SsoCallbackPage />, {
      route: `${CALLBACK}?code=${VALID_HANDOFF_CODE}&return_to=${encodeURIComponent('/org-a/asset/1?tab=2')}`,
      withRoutes: true,
    })

    await expectLocation('/org-a/asset/1?tab=2')
    expect(screen.getByTestId('location')).not.toHaveTextContent('code=')
  })

  it('ignora return_to a otro host y navega a /{org}/home', async () => {
    countExchanges()
    renderWithProviders(<SsoCallbackPage />, {
      route: `${CALLBACK}?code=${VALID_HANDOFF_CODE}&return_to=${encodeURIComponent('//evil.example.com/x')}`,
      withRoutes: true,
    })

    await expectLocation(`/${ORG_A_ID}/home`)
  })

  it('el return_to que devuelve el backend en el exchange tiene prioridad', async () => {
    server.use(
      http.post(`${backendUrl}/auth/sso/exchange`, () =>
        respondOk({ message: 'ok', user: activeUser, token: loginTokenFor(), return_to: '/org-a/templates' }),
      ),
    )
    renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?code=${VALID_HANDOFF_CODE}`, withRoutes: true })

    await expectLocation('/org-a/templates')
  })

  it('usa la organización pendiente del flujo SSO cuando el token no trae login_org_id', async () => {
    const counter = countExchanges()
    server.use(
      http.post(`${backendUrl}/auth/sso/exchange`, () =>
        respondOk({ message: 'ok', user: activeUser, token: loginTokenFor({ login_org_id: null }), return_to: null }),
      ),
    )
    savePendingSsoState({ connectionId: 'c', connectionName: 'Microsoft', email: null, returnUrl: null, pendingOrganizationId: ORG_B_ID })
    renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?code=${VALID_HANDOFF_CODE}`, withRoutes: true })

    await expectLocation(`/${ORG_B_ID}/home`)
    expect(counter.orgTokenRequests).toEqual([ORG_B_ID])
    expect(sessionStorage.getItem('sso.flow')).toBeNull()
  })

  it('tras cambiar de organización no vuelve a una ruta de la organización anterior', async () => {
    const counter = countExchanges()
    server.use(
      http.post(`${backendUrl}/auth/sso/exchange`, () =>
        respondOk({ message: 'ok', user: activeUser, token: loginTokenFor({ login_org_id: null }), return_to: null }),
      ),
    )
    savePendingSsoState({
      connectionId: 'c',
      connectionName: 'Microsoft',
      email: null,
      returnUrl: `/${ORG_A_ID}/asset/x`,
      pendingOrganizationId: ORG_B_ID,
    })
    renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?code=${VALID_HANDOFF_CODE}`, withRoutes: true })

    await expectLocation(`/${ORG_B_ID}/home`)
    expect(counter.orgTokenRequests).toEqual([ORG_B_ID])
  })

  it('respeta la ruta de vuelta si es de la organización recién seleccionada', async () => {
    server.use(
      http.post(`${backendUrl}/auth/sso/exchange`, () =>
        respondOk({ message: 'ok', user: activeUser, token: loginTokenFor({ login_org_id: null }), return_to: null }),
      ),
    )
    savePendingSsoState({
      connectionId: 'c',
      connectionName: 'Microsoft',
      email: null,
      returnUrl: `/${ORG_B_ID}/templates`,
      pendingOrganizationId: ORG_B_ID,
    })
    renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?code=${VALID_HANDOFF_CODE}`, withRoutes: true })

    await expectLocation(`/${ORG_B_ID}/templates`)
  })

  it('?error=tenant_not_allowed muestra el mensaje específico, quita el error de la URL y ofrece volver al login', async () => {
    const { user } = renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?error=tenant_not_allowed`, withRoutes: true })

    expect(await screen.findByRole('alert')).toHaveTextContent('directory that is not allowed')
    await expectLocation(CALLBACK)
    expect(screen.getByTestId('location')).not.toHaveTextContent('error=')

    await user.click(screen.getByRole('button', { name: 'Back to sign in' }))
    await expectLocation('/login')
  })

  it('un código de error desconocido usa el mensaje genérico; sso_disabled tiene el suyo', async () => {
    renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?error=algo_raro`, withRoutes: true })
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be completed')
  })

  it('sso_disabled muestra que el servidor no tiene SSO habilitado', async () => {
    renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?error=sso_disabled`, withRoutes: true })
    expect(await screen.findByRole('alert')).toHaveTextContent('not enabled on this server')
  })

  it('un handoff code inválido o ya usado muestra ssoErrors.handoff_invalid sin iniciar sesión', async () => {
    renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?code=ya-usado`, withRoutes: true })

    expect(await screen.findByRole('alert')).toHaveTextContent('sign-in link expired')
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('?linked=1 con sesión muestra el toast y navega a return_to saneado o /home', async () => {
    renderWithProviders(<SsoCallbackPage />, {
      route: `${CALLBACK}?linked=1&return_to=${encodeURIComponent('/org-a/profile')}`,
      withRoutes: true,
      session: { token: makeLoginToken(), user: activeUser },
    })

    await expectLocation('/org-a/profile')
    expect(toastSuccess).toHaveBeenCalledTimes(1)
  })

  it('?linked=1 sin sesión manda al login', async () => {
    renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?linked=1`, withRoutes: true })
    await expectLocation('/login')
    expect(toastSuccess).not.toHaveBeenCalled()
  })

  it('sin parámetros manda al login', async () => {
    renderWithProviders(<SsoCallbackPage />, { route: CALLBACK, withRoutes: true })
    await expectLocation('/login')
  })

  it('si la organización exige otro método tras el SSO (403 AUTH_METHOD_REQUIRED) no redirige de nuevo: modo manual', async () => {
    server.use(
      http.post(`${backendUrl}/auth/sso/exchange`, () =>
        respondOk({ message: 'ok', user: activeUser, token: loginTokenFor(), return_to: null }),
      ),
      authMethodRequiredHandler({ auth_flow: 'internal_code' }),
    )
    renderWithProviders(<SsoCallbackPage />, { route: `${CALLBACK}?code=${VALID_HANDOFF_CODE}`, withRoutes: true })

    expect(await screen.findByRole('alert')).toHaveTextContent('still requires a different sign-in method')
    expect(screen.getByTestId('location')).toHaveTextContent(CALLBACK)
    // La sesión sí quedó iniciada; solo falta la organización.
    expect(localStorage.getItem('auth_token')).toBeTruthy()
    expect(localStorage.getItem('organizationToken')).toBeNull()
  })
})
