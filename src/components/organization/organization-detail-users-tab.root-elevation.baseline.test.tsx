/**
 * Plan modo administrador (docs/sso-frontend.md, Fase 7, bloque E) · BASELINE · integración.
 *
 * Una pantalla de root que no conoce el modo administrador sigue funcionando: su request
 * responde 403 `ROOT_ELEVATION_REQUIRED`, `httpClient` abre el diálogo del código y, al
 * verificarlo, la misma request se reintenta sola (sin repetir el clic).
 */
import { http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { OrganizationDetailUsersTab } from '@/components/organization/organization-detail-users-tab'
import { RootElevationDialog } from '@/components/auth/root-elevation-dialog'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { ROOT_ELEVATION_TOKEN, VALID_CODE, rootOnlyHandler } from '@/test/msw/handlers/auth'
import { activeUser, internalConnection, ORG_A_ID, rootAdmin } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import type { Organization } from '@/types/organizations'

const organization: Organization = { id: ORG_A_ID, name: 'Org A', default_auth_type_id: null }
const rootSession = { token: makeLoginToken({ sub: rootAdmin.id, email: rootAdmin.email, is_root_admin: true }), user: rootAdmin }
const rootOrg = { id: ORG_A_ID, token: makeOrgToken({ sub: rootAdmin.id, is_root_admin: true, permissions: [] }) }

function otpInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>('input#root-elevation-otp')
  if (!input) throw new Error('OTP input not found')
  return input
}

describe('OrganizationDetailUsersTab · agregar miembro en modo administrador', () => {
  it('403 ROOT_ELEVATION_REQUIRED abre el diálogo y, al verificar, las requests se reintentan y el miembro se agrega', async () => {
    const posted: Array<{ body: Record<string, unknown>; elevation: string | null }> = []
    const listed: (string | null)[] = []
    server.use(
      http.get(`${backendUrl}/organizations/${ORG_A_ID}/users`, () => respondOk([], { page: 1, page_size: 100, has_next: false })),
      http.get(`${backendUrl}/auth_types/`, () => respondOk([internalConnection])),
      rootOnlyHandler('get', '/users', ({ request }) => {
        listed.push(request.headers.get('X-Root-Elevation'))
        return respondOk([{ ...activeUser, id: 'u-new', name: 'Nueva', last_name: 'Persona', email: 'nueva@example.com' }], {
          page: 1,
          page_size: 50,
          has_next: false,
        })
      }),
      rootOnlyHandler('post', `/organizations/${ORG_A_ID}/users`, async ({ request }) => {
        posted.push({ body: (await request.json()) as Record<string, unknown>, elevation: request.headers.get('X-Root-Elevation') })
        return respondOk({ user_id: 'u-new', organization_id: ORG_A_ID })
      }),
    )
    const { user } = renderWithProviders(
      <>
        <RootElevationDialog />
        <OrganizationDetailUsersTab organization={organization} canListUsers canSetAdmin canManageMembers canEditAuthMethod />
      </>,
      { session: rootSession, org: rootOrg },
    )

    // Abrir el buscador de usuarios pide la lista global (solo root): sin modo administrador, 403.
    await user.click(await screen.findByRole('button', { name: /add user/i }))
    expect(await screen.findByText(/This action requires admin mode/)).toBeInTheDocument()

    await user.type(otpInput(), VALID_CODE)
    await user.click(screen.getByRole('button', { name: 'Enter admin mode' }))

    // La lista se reintentó sola con el token. El diálogo es modal, así que el popover se
    // cerró al abrirlo: se reabre y el alta ya viaja con el token.
    await waitFor(() => expect(listed).toContain(ROOT_ELEVATION_TOKEN))
    await waitFor(() => expect(screen.queryByTestId('root-elevation-dialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Nueva Persona')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.click(await screen.findByText('Nueva Persona'))
    await waitFor(() => expect(posted).toHaveLength(1))
    expect(posted[0]).toEqual({ body: { user_id: 'u-new' }, elevation: ROOT_ELEVATION_TOKEN })
    expect(listed.filter((header) => header === ROOT_ELEVATION_TOKEN).length).toBeGreaterThan(0)
    expect(screen.queryByTestId('root-elevation-dialog')).not.toBeInTheDocument()
  })
})
