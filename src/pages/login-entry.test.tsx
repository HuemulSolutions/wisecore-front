/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 2 · `/login`.
 */
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LoginEntryPage } from '@/pages/login-entry'
import { renderWithProviders } from '@/test/render'
import { makeLoginToken } from '@/test/jwt'
import { activeUser } from '@/test/fixtures'

describe('LoginEntryPage', () => {
  it('/login?email=… prefilla el email del formulario', async () => {
    renderWithProviders(<LoginEntryPage />, { route: '/login?email=ada%40example.com', withRoutes: true })

    const input = await screen.findByPlaceholderText('email@example.com')
    expect(input).toHaveValue('ada@example.com')
  })

  it('con sesión activa redirige a la raíz', async () => {
    renderWithProviders(<LoginEntryPage />, {
      route: '/login',
      withRoutes: true,
      session: { token: makeLoginToken(), user: activeUser },
    })

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/'))
    expect(screen.queryByPlaceholderText('email@example.com')).not.toBeInTheDocument()
  })
})
