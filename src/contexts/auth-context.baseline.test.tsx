/**
 * Plan SSO frontend (docs/sso-frontend.md) · BASELINE · AuthContext.
 */
import { http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { useAuth } from '@/contexts/auth-context'
import { httpClient } from '@/lib/http-client'
import { sessionEvents } from '@/lib/session-events'
import { renderWithProviders } from '@/test/render'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import { activeUser, ORG_A_ID } from '@/test/fixtures'
import { server } from '@/test/msw/server'
import { respondApiError } from '@/test/msw/respond'

const toastError = vi.fn()
vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>()
  return { ...actual, toast: { ...actual.toast, error: (...args: unknown[]) => toastError(...args), success: vi.fn() } }
})

function Probe() {
  const { isAuthenticated, user, logout } = useAuth()
  return (
    <div>
      <div data-testid="auth">{isAuthenticated ? `auth:${user?.email}` : 'anon'}</div>
      <button onClick={logout}>salir</button>
    </div>
  )
}

describe('AuthContext', () => {
  it('restaura la sesión desde localStorage', async () => {
    renderWithProviders(<Probe />, { session: { token: makeLoginToken(), user: activeUser } })
    expect(await screen.findByTestId('auth')).toHaveTextContent('auth:ada@example.com')
  })

  it('logout limpia las 4 claves, el httpClient y emite el evento de sesión', async () => {
    const listener = vi.fn()
    const unsubscribe = sessionEvents.subscribe(listener)
    const { user } = renderWithProviders(<Probe />, {
      session: { token: makeLoginToken(), user: activeUser },
      org: { id: ORG_A_ID, token: makeOrgToken() },
    })
    await screen.findByText('auth:ada@example.com')

    await user.click(screen.getByRole('button', { name: 'salir' }))

    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('anon'))
    for (const key of ['auth_token', 'auth_user', 'selectedOrganizationId', 'organizationToken']) {
      expect(localStorage.getItem(key)).toBeNull()
    }
    expect(httpClient.getLoginToken()).toBeNull()
    expect(httpClient.getOrganizationToken()).toBeNull()
    expect(listener).toHaveBeenCalledWith('logout')
    unsubscribe()
  })

  it('un 401 real muestra el toast de sesión expirada, cierra sesión y guarda returnUrl', async () => {
    window.history.pushState({}, '', '/org-a/home')
    renderWithProviders(<Probe />, { session: { token: makeLoginToken(), user: activeUser } })
    await screen.findByText('auth:ada@example.com')
    server.use(http.get(`${backendUrl}/documents/`, () => respondApiError(401, 'UNAUTHORIZED', 'expired', 'expired')))

    await httpClient.get(`${backendUrl}/documents/`).catch(() => undefined)

    await waitFor(() => expect(screen.getByTestId('auth')).toHaveTextContent('anon'))
    expect(toastError).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('returnUrl')).toBe('/org-a/home')
    window.history.pushState({}, '', '/')
  })
})
