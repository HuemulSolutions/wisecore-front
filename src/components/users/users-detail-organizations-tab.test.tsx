/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 6 · método por organización en el detalle de un usuario.
 */
import { http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { UsersDetailOrganizationsTab } from '@/components/users/users-detail-organizations-tab'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import {
  activeUser,
  googleConnection,
  internalConnection,
  internalMembership,
  MICROSOFT_CONNECTION_ID,
  microsoftConnection,
  microsoftMembership,
  ORG_A_ID,
  ORG_B_ID,
  orgA,
  orgB,
  rootAdmin,
} from '@/test/fixtures'
import { makeLoginToken } from '@/test/jwt'

const rootSession = { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin }

function rowOf(name: string) {
  return screen.getByText(name).closest('div.rounded-lg') as HTMLElement
}

describe('UsersDetailOrganizationsTab · método por membresía', () => {
  it('muestra el método de cada organización y lo cambia con el organization_id de esa fila', async () => {
    const calls: Array<{ url: string; orgHeader: string | null; body: Record<string, unknown> }> = []
    server.use(
      http.get(`${backendUrl}/users/organizations`, () =>
        respondOk([
          { ...orgA, auth_type_id: internalMembership.id, auth_type: internalMembership },
          { ...orgB, auth_type_id: MICROSOFT_CONNECTION_ID, auth_type: microsoftMembership },
        ]),
      ),
      http.get(`${backendUrl}/auth_types/`, ({ request }) => {
        // El root admin pide las conexiones de la organización de cada fila.
        const orgId = new URL(request.url).searchParams.get('organization_id')
        return respondOk(orgId === ORG_A_ID ? [internalConnection, microsoftConnection, googleConnection] : [internalConnection])
      }),
      http.patch(`${backendUrl}/organizations/:orgId/users/:userId/auth-method`, async ({ request, params }) => {
        calls.push({ url: String(params.orgId), orgHeader: request.headers.get('X-Org-Id'), body: (await request.json()) as Record<string, unknown> })
        return respondOk({ user_id: activeUser.id, organization_id: params.orgId, auth_type_id: MICROSOFT_CONNECTION_ID, auth_type: microsoftMembership })
      }),
    )
    const { user } = renderWithProviders(<UsersDetailOrganizationsTab user={activeUser} canManageMembers />, { session: rootSession })

    await screen.findByText('Org A')
    const triggerA = within(rowOf('Org A')).getByRole('combobox')
    const triggerB = within(rowOf('Org B')).getByRole('combobox')
    await waitFor(() => expect(triggerA).toHaveTextContent('Internal Authentication'))
    await waitFor(() => expect(triggerB).toHaveTextContent('Microsoft Contoso'))

    await user.click(triggerA)
    await user.click(within(await screen.findByRole('listbox')).getByText('Microsoft Contoso'))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].url).toBe(ORG_A_ID)
    expect(calls[0].orgHeader).toBe(ORG_A_ID)
    expect(calls[0].body).toEqual({ auth_type_id: MICROSOFT_CONNECTION_ID })
  })

  it('en solo lectura muestra badges; sin el campo (backend viejo) no muestra nada', async () => {
    server.use(
      http.get(`${backendUrl}/users/organizations`, () =>
        respondOk([{ ...orgA, auth_type_id: MICROSOFT_CONNECTION_ID, auth_type: microsoftMembership }, { ...orgB, id: ORG_B_ID }]),
      ),
    )
    renderWithProviders(<UsersDetailOrganizationsTab user={activeUser} canManageMembers={false} />, { session: rootSession })

    await screen.findByText('Org A')
    expect(within(rowOf('Org A')).getByText('Microsoft Contoso')).toBeInTheDocument()
    expect(within(rowOf('Org B')).queryByText('Email code')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
