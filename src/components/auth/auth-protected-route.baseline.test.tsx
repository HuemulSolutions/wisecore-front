/**
 * Plan SSO frontend (docs/sso-frontend.md) · BASELINE · ProtectedRoute.
 */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProtectedRoute } from '@/components/auth/auth-protected-route'
import { renderWithProviders } from '@/test/render'
import { makeLoginToken } from '@/test/jwt'
import { activeUser } from '@/test/fixtures'

describe('ProtectedRoute', () => {
  it('sin sesión renderiza la página de login en la URL actual y guarda returnUrl', async () => {
    window.history.pushState({}, '', '/org-a/asset/7?tab=1')
    renderWithProviders(
      <ProtectedRoute>
        <div>contenido privado</div>
      </ProtectedRoute>,
    )

    expect(await screen.findByPlaceholderText('email@example.com')).toBeInTheDocument()
    expect(screen.queryByText('contenido privado')).not.toBeInTheDocument()
    expect(sessionStorage.getItem('returnUrl')).toBe('/org-a/asset/7?tab=1')
    window.history.pushState({}, '', '/')
  })

  it('en "/" y "/home" no guarda returnUrl', async () => {
    window.history.pushState({}, '', '/home')
    renderWithProviders(
      <ProtectedRoute>
        <div>contenido privado</div>
      </ProtectedRoute>,
    )
    await screen.findByPlaceholderText('email@example.com')
    expect(sessionStorage.getItem('returnUrl')).toBeNull()
    window.history.pushState({}, '', '/')
  })

  it('con sesión renderiza los children', async () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>contenido privado</div>
      </ProtectedRoute>,
      { session: { token: makeLoginToken(), user: activeUser } },
    )

    expect(await screen.findByText('contenido privado')).toBeInTheDocument()
  })
})
