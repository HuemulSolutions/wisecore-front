/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 2 · enrutamiento público vs privado.
 *
 * Monta `App` real (con sus providers) para verificar que las rutas públicas
 * quedan fuera del guard y que el comodín sigue protegido.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import App from '@/App'
import { makeTestQueryClient } from '@/test/render'

function renderApp(route: string) {
  return render(
    <QueryClientProvider client={makeTestQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App · rutas públicas', () => {
  it('/auth/sso/callback es pública: sin sesión muestra el error del IdP, no el login', async () => {
    renderApp('/auth/sso/callback?error=account_conflict')
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists with a different sign-in method')
    expect(screen.queryByPlaceholderText('email@example.com')).not.toBeInTheDocument()
  })

  it('/login es pública y muestra el formulario', async () => {
    renderApp('/login')
    expect(await screen.findByPlaceholderText('email@example.com')).toBeInTheDocument()
  })

  it('cualquier otra ruta sigue protegida: sin sesión muestra el login', async () => {
    renderApp('/org-a/templates')
    expect(await screen.findByPlaceholderText('email@example.com')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
