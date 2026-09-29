/**
 * Plan modo administrador (docs/sso-frontend.md, Fase 7, bloque D) · BASELINE · /global-admin.
 *
 * Todo lo de Global Admin es de root: sin modo administrador la página pide el código
 * al entrar y no dispara ninguna query; al verificarlo carga con `X-Root-Elevation`.
 */
import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import GlobalAdminPage from '@/pages/global-admin'
import { RootElevationDialog } from '@/components/auth/root-elevation-dialog'
import { rootElevationStore } from '@/lib/root-elevation-store'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { ROOT_ELEVATION_TOKEN, VALID_CODE, rootOnlyHandler } from '@/test/msw/handlers/auth'
import { renderWithProviders } from '@/test/render'
import { orgA, rootAdmin } from '@/test/fixtures'
import { makeLoginToken } from '@/test/jwt'

const rootSession = { token: makeLoginToken({ sub: rootAdmin.id, email: rootAdmin.email, is_root_admin: true }), user: rootAdmin }

function otpInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input#root-elevation-otp')
  if (!input) throw new Error('OTP input not found')
  return input
}

/** Handlers solo-root de las listas de Global Admin, contando cada request. */
function globalAdminBackend() {
  const requests = { organizations: [] as (string | null)[], users: [] as (string | null)[] }
  server.use(
    rootOnlyHandler('get', '/organizations', ({ request }) => {
      requests.organizations.push(request.headers.get('X-Root-Elevation'))
      return respondOk([orgA], { page: 1, page_size: 100, has_next: false })
    }),
    rootOnlyHandler('get', '/users', ({ request }) => {
      requests.users.push(request.headers.get('X-Root-Elevation'))
      return respondOk([rootAdmin], { page: 1, page_size: 100, has_next: false })
    }),
  )
  return requests
}

function renderPage() {
  return renderWithProviders(
    <>
      <RootElevationDialog />
      <GlobalAdminPage />
    </>,
    { session: rootSession, route: '/global-admin' },
  )
}

describe('/global-admin · modo administrador', () => {
  it('sin modo administrador pide el código al entrar y no dispara GET /organizations ni GET /users', async () => {
    const requests = globalAdminBackend()
    renderPage()

    expect(await screen.findByText(/Enter the 6-digit code we sent to/)).toBeInTheDocument()
    expect(screen.getByText('Admin mode required')).toBeInTheDocument()
    expect(requests.organizations).toEqual([])
    expect(requests.users).toEqual([])
  })

  it('al verificar el código carga las organizaciones con X-Root-Elevation', async () => {
    const requests = globalAdminBackend()
    const { user } = renderPage()
    await screen.findByText(/Enter the 6-digit code we sent to/)

    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: 'Enter admin mode' }))

    expect(await screen.findByText('Org A')).toBeInTheDocument()
    expect(requests.organizations.length).toBeGreaterThan(0)
    expect(requests.organizations.every((header) => header === ROOT_ELEVATION_TOKEN)).toBe(true)
    expect(screen.queryByText('Admin mode required')).not.toBeInTheDocument()
  })

  it('si se cancela queda el estado vacío con "Enter admin mode", que vuelve a pedir el código', async () => {
    const requests = globalAdminBackend()
    const { user } = renderPage()
    await screen.findByText(/Enter the 6-digit code we sent to/)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByTestId('root-elevation-dialog')).not.toBeInTheDocument())

    expect(screen.getByText('Admin mode required')).toBeInTheDocument()
    // Cancelar no vuelve a abrir el diálogo solo.
    expect(rootElevationStore.getSnapshot().prompt).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Enter admin mode' }))
    expect(await screen.findByTestId('root-elevation-dialog')).toBeInTheDocument()
    expect(requests.organizations).toEqual([])
  })

  it('si se entró ya en modo administrador y el usuario sale, no vuelve a pedir el código solo', async () => {
    // Regresión (prueba manual): "Go to Global Admin" remonta la página ya elevada; al salir
    // por el badge la página abría el diálogo por su cuenta.
    rootElevationStore.setElevation(ROOT_ELEVATION_TOKEN, Date.now() + 30 * 60 * 1000)
    globalAdminBackend()
    renderPage()
    expect(await screen.findByText('Org A')).toBeInTheDocument()

    act(() => rootElevationStore.clear())

    expect(await screen.findByText('Admin mode required')).toBeInTheDocument()
    expect(rootElevationStore.getSnapshot().prompt).toBeNull()
    expect(screen.queryByTestId('root-elevation-dialog')).not.toBeInTheDocument()
  })

  it('ya en modo administrador carga directo, sin pedir el código', async () => {
    rootElevationStore.setElevation(ROOT_ELEVATION_TOKEN, Date.now() + 30 * 60 * 1000)
    const requests = globalAdminBackend()
    renderPage()

    expect(await screen.findByText('Org A')).toBeInTheDocument()
    expect(screen.queryByTestId('root-elevation-dialog')).not.toBeInTheDocument()
    expect(requests.organizations[0]).toBe(ROOT_ELEVATION_TOKEN)
  })
})
