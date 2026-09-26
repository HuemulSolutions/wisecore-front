/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 6 · método de autenticación por miembro.
 */
import { http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { OrganizationDetailUsersTab } from '@/components/organization/organization-detail-users-tab'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import {
  activeUser,
  googleConnection,
  googleMembership,
  internalConnection,
  internalMembership,
  MICROSOFT_CONNECTION_ID,
  microsoftConnection,
  microsoftMembership,
  ORG_A_ID,
  rootAdmin,
} from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import type { Organization, OrganizationUser } from '@/types/organizations'

const organization: Organization = { id: ORG_A_ID, name: 'Org A', default_auth_type_id: null }

const members: OrganizationUser[] = [
  { id: 'u-ada', email: 'ada@example.com', name: 'Ada', last_name: 'Lovelace', status: 'active', is_org_admin: false, auth_type_id: MICROSOFT_CONNECTION_ID, auth_type: microsoftMembership },
  { id: 'u-grace', email: 'grace@example.com', name: 'Grace', last_name: 'Hopper', status: 'active', is_org_admin: true, auth_type_id: null, auth_type: null },
  { id: 'u-linus', email: 'linus@example.com', name: 'Linus', last_name: 'Torvalds', status: 'active', is_org_admin: false, auth_type_id: googleMembership.id, auth_type: googleMembership },
]

function useMembers(list: unknown[] = members) {
  server.use(
    http.get(`${backendUrl}/organizations/${ORG_A_ID}/users`, () => respondOk(list, { page: 1, page_size: 100, has_next: false })),
    http.get(`${backendUrl}/auth_types/`, () => respondOk([internalConnection, microsoftConnection, googleConnection])),
  )
}

const rootSession = { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin }
const orgAdminSession = { token: makeLoginToken({ sub: activeUser.id }), user: activeUser }
const orgAdminOrg = { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, is_org_admin: true, permissions: [] }) }

function rowOf(name: string) {
  return screen.getByText(name).closest('div.rounded-lg') as HTMLElement
}

describe('OrganizationDetailUsersTab · método de autenticación por miembro', () => {
  it('sin permiso de edición muestra el método de cada miembro como badge (null = código por email)', async () => {
    useMembers()
    renderWithProviders(
      <OrganizationDetailUsersTab organization={organization} canListUsers canSetAdmin={false} />,
      { session: orgAdminSession, org: orgAdminOrg },
    )

    await screen.findByText('Ada Lovelace')
    expect(within(rowOf('Ada Lovelace')).getByText('Microsoft Contoso')).toBeInTheDocument()
    expect(within(rowOf('Grace Hopper')).getByText('Email code')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('con un backend viejo (sin auth_type) no muestra nada del método', async () => {
    useMembers([{ id: 'u-old', email: 'old@example.com', name: 'Old', last_name: 'Backend', status: 'active', is_org_admin: false }])
    renderWithProviders(
      <OrganizationDetailUsersTab organization={organization} canListUsers canSetAdmin={false} canEditAuthMethod />,
      { session: rootSession },
    )

    await screen.findByText('Old Backend')
    expect(screen.queryByText('Email code')).not.toBeInTheDocument()
  })

  it('el admin de la organización cambia el método de un miembro: PATCH con auth_type_id y X-Org-Id de la organización', async () => {
    useMembers()
    const calls: Array<{ url: string; orgHeader: string | null; body: Record<string, unknown> }> = []
    server.use(
      http.patch(`${backendUrl}/organizations/${ORG_A_ID}/users/:userId/auth-method`, async ({ request }) => {
        calls.push({ url: request.url, orgHeader: request.headers.get('X-Org-Id'), body: (await request.json()) as Record<string, unknown> })
        return respondOk({ user_id: 'u-grace', organization_id: ORG_A_ID, auth_type_id: MICROSOFT_CONNECTION_ID, auth_type: microsoftMembership })
      }),
    )
    const { user } = renderWithProviders(
      <OrganizationDetailUsersTab organization={organization} canListUsers canSetAdmin={false} canEditAuthMethod />,
      { session: orgAdminSession, org: orgAdminOrg },
    )

    await screen.findByText('Grace Hopper')
    const trigger = within(rowOf('Grace Hopper')).getByRole('combobox')
    // Sin método explícito, el select muestra la conexión interna (lo que aplica el backend).
    await waitFor(() => expect(trigger).toHaveTextContent('Internal Authentication'))
    await user.click(trigger)
    const listbox = await screen.findByRole('listbox')
    await user.click(within(listbox).getByText('Microsoft Contoso'))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].url).toContain('/users/u-grace/auth-method')
    expect(calls[0].orgHeader).toBe(ORG_A_ID)
    expect(calls[0].body).toEqual({ auth_type_id: MICROSOFT_CONNECTION_ID })
  })

  it('el admin (no root) que pasa SU propia membresía a SSO confirma antes del PATCH', async () => {
    useMembers([{ ...members[1], id: activeUser.id, name: 'Self', last_name: 'Admin' }])
    const calls: string[] = []
    server.use(
      http.patch(`${backendUrl}/organizations/${ORG_A_ID}/users/:userId/auth-method`, ({ request }) => {
        calls.push(request.url)
        return respondOk({ user_id: activeUser.id, organization_id: ORG_A_ID, auth_type_id: MICROSOFT_CONNECTION_ID, auth_type: microsoftMembership })
      }),
    )
    const { user } = renderWithProviders(
      <OrganizationDetailUsersTab organization={organization} canListUsers canSetAdmin={false} canEditAuthMethod />,
      { session: orgAdminSession, org: orgAdminOrg },
    )

    await screen.findByText('Self Admin')
    const trigger = within(rowOf('Self Admin')).getByRole('combobox')
    await waitFor(() => expect(trigger).toBeEnabled())
    await user.click(trigger)
    await user.click(within(await screen.findByRole('listbox')).getByText('Microsoft Contoso'))

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Change your own sign-in method?')).toBeInTheDocument()
    expect(calls).toHaveLength(0)

    await user.click(within(dialog).getByRole('button', { name: 'Change method' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]).toContain(`/users/${activeUser.id}/auth-method`)
  })

  it('una conexión inactiva sigue visible como el método actual del miembro', async () => {
    useMembers()
    const { user } = renderWithProviders(
      <OrganizationDetailUsersTab organization={organization} canListUsers canSetAdmin={false} canEditAuthMethod />,
      { session: rootSession },
    )

    await screen.findByText('Linus Torvalds')
    const trigger = within(rowOf('Linus Torvalds')).getByRole('combobox')
    await waitFor(() => expect(trigger).toHaveTextContent('Google Workspace (not available)'))
    await user.click(trigger)
    const listbox = await screen.findByRole('listbox')
    // Las elegibles: interna + Microsoft (activa, de Org A); Google inactiva solo como valor actual.
    expect(within(listbox).getByText('Internal Authentication')).toBeInTheDocument()
    expect(within(listbox).getByText('Microsoft Contoso')).toBeInTheDocument()
    expect(within(listbox).getByText('Google Workspace (not available)')).toBeInTheDocument()
  })

  it('el root admin agrega un miembro con el método elegido para nuevos miembros', async () => {
    useMembers([])
    const posted: Array<Record<string, unknown>> = []
    server.use(
      http.get(`${backendUrl}/users`, () =>
        respondOk([{ ...activeUser, id: 'u-new', name: 'Nueva', last_name: 'Persona', email: 'nueva@example.com' }], { page: 1, page_size: 50, has_next: false }),
      ),
      http.post(`${backendUrl}/organizations/${ORG_A_ID}/users`, async ({ request }) => {
        posted.push((await request.json()) as Record<string, unknown>)
        return respondOk({ user_id: 'u-new', organization_id: ORG_A_ID })
      }),
    )
    const { user } = renderWithProviders(
      <OrganizationDetailUsersTab organization={organization} canListUsers canSetAdmin canManageMembers canEditAuthMethod />,
      { session: rootSession },
    )

    const methodSelect = await screen.findByLabelText('Sign-in method for new members')
    await waitFor(() => expect(methodSelect).toBeEnabled())
    await user.click(methodSelect)
    await user.click(within(await screen.findByRole('listbox')).getByText('Microsoft Contoso'))

    await user.click(screen.getByRole('button', { name: /add user/i }))
    await user.click(await screen.findByText('Nueva Persona'))

    await waitFor(() => expect(posted).toHaveLength(1))
    expect(posted[0]).toEqual({ user_id: 'u-new', auth_type_id: MICROSOFT_CONNECTION_ID })
  })

  it('sin elegir método, agregar un miembro no manda auth_type_id (aplica el default de la organización)', async () => {
    useMembers([])
    const posted: Array<Record<string, unknown>> = []
    server.use(
      http.get(`${backendUrl}/users`, () =>
        respondOk([{ ...activeUser, id: 'u-new', name: 'Nueva', last_name: 'Persona', email: 'nueva@example.com' }], { page: 1, page_size: 50, has_next: false }),
      ),
      http.post(`${backendUrl}/organizations/${ORG_A_ID}/users`, async ({ request }) => {
        posted.push((await request.json()) as Record<string, unknown>)
        return respondOk({ user_id: 'u-new', organization_id: ORG_A_ID })
      }),
    )
    const { user } = renderWithProviders(
      <OrganizationDetailUsersTab organization={{ ...organization, default_auth_type_id: internalMembership.id }} canListUsers canSetAdmin canManageMembers canEditAuthMethod />,
      { session: rootSession },
    )

    await user.click(await screen.findByRole('button', { name: /add user/i }))
    await user.click(await screen.findByText('Nueva Persona'))

    await waitFor(() => expect(posted).toHaveLength(1))
    expect(posted[0]).toEqual({ user_id: 'u-new' })
  })
})
