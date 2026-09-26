/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 6 · método por membresía en la lista de /users.
 */
import { http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import UserTable from '@/components/users/users-table'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import {
  activeUser,
  internalConnection,
  internalMembership,
  MICROSOFT_CONNECTION_ID,
  microsoftConnection,
  microsoftMembership,
  ORG_A_ID,
  rootAdmin,
} from '@/test/fixtures'
import { makeLoginToken } from '@/test/jwt'
import type { User } from '@/types/users'

const rootSession = { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin }

// Como los devuelve `GET /user_roles/users_with_roles`: método de la membresía en ORG_A.
const member = { ...activeUser, auth_type_id: internalMembership.id, auth_type: internalMembership } as User
const self = { ...rootAdmin, auth_type_id: MICROSOFT_CONNECTION_ID, auth_type: microsoftMembership } as User

function renderTable(
  users: User[],
  props: { canEditAuthMethod?: boolean; organizationId?: string; session?: typeof rootSession } = {},
) {
  const onSelectUser = vi.fn()
  const result = renderWithProviders(
    <UserTable
      users={users}
      selectedUsers={new Set()}
      onUserSelection={() => {}}
      onSelectAll={() => {}}
      onSelectUser={onSelectUser}
      organizationId={'organizationId' in props ? props.organizationId : ORG_A_ID}
      canEditAuthMethod={props.canEditAuthMethod ?? false}
    />,
    { session: props.session ?? rootSession },
  )
  return { ...result, onSelectUser }
}

describe('UserTable · método de inicio de sesión de la membresía', () => {
  it('el admin lo cambia desde la fila con la organización activa, sin abrir el panel', async () => {
    const calls: Array<{ orgId: string; userId: string; body: Record<string, unknown> }> = []
    server.use(
      http.get(`${backendUrl}/auth_types/`, () => respondOk([internalConnection, microsoftConnection])),
      http.patch(`${backendUrl}/organizations/:orgId/users/:userId/auth-method`, async ({ request, params }) => {
        calls.push({
          orgId: String(params.orgId),
          userId: String(params.userId),
          body: (await request.json()) as Record<string, unknown>,
        })
        return respondOk({ user_id: member.id, organization_id: params.orgId, auth_type_id: MICROSOFT_CONNECTION_ID, auth_type: microsoftMembership })
      }),
    )
    const { user, onSelectUser } = renderTable([member], { canEditAuthMethod: true })

    const trigger = await screen.findByRole('combobox')
    await waitFor(() => expect(trigger).toHaveTextContent('Internal Authentication'))

    await user.click(trigger)
    await user.click(within(await screen.findByRole('listbox')).getByText('Microsoft Contoso'))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0]).toEqual({ orgId: ORG_A_ID, userId: member.id, body: { auth_type_id: MICROSOFT_CONNECTION_ID } })
    expect(onSelectUser).not.toHaveBeenCalled()
  })

  it('el root admin cambia su propio método a interno directo, sin confirmación', async () => {
    const calls: string[] = []
    server.use(
      http.get(`${backendUrl}/auth_types/`, () => respondOk([internalConnection, microsoftConnection])),
      http.patch(`${backendUrl}/organizations/:orgId/users/:userId/auth-method`, async ({ request, params }) => {
        calls.push(String(params.userId))
        const body = (await request.json()) as { auth_type_id: string }
        return respondOk({ user_id: params.userId, organization_id: params.orgId, auth_type_id: body.auth_type_id, auth_type: internalMembership })
      }),
    )
    const { user } = renderTable([self], { canEditAuthMethod: true })

    const trigger = await screen.findByRole('combobox')
    await waitFor(() => expect(trigger).toHaveTextContent('Microsoft Contoso'))
    await user.click(trigger)
    await user.click(within(await screen.findByRole('listbox')).getByText('Internal Authentication'))

    await waitFor(() => expect(calls).toEqual([self.id]))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('un org admin que se pasa a sí mismo a SSO confirma antes de guardar', async () => {
    const calls: string[] = []
    server.use(
      http.get(`${backendUrl}/auth_types/`, () => respondOk([internalConnection, microsoftConnection])),
      http.patch(`${backendUrl}/organizations/:orgId/users/:userId/auth-method`, ({ params }) => {
        calls.push(String(params.userId))
        return respondOk({ user_id: params.userId, organization_id: params.orgId, auth_type_id: MICROSOFT_CONNECTION_ID, auth_type: microsoftMembership })
      }),
    )
    const orgAdminSession = { token: makeLoginToken({ sub: member.id, is_root_admin: false }), user: member }
    const { user } = renderTable([member], { canEditAuthMethod: true, session: orgAdminSession })

    const pick = async () => {
      const trigger = await screen.findByRole('combobox')
      await waitFor(() => expect(trigger).toHaveTextContent('Internal Authentication'))
      await user.click(trigger)
      await user.click(within(await screen.findByRole('listbox')).getByText('Microsoft Contoso'))
      return screen.findByRole('alertdialog')
    }

    // Cancelar: no se guarda nada.
    const first = await pick()
    await user.click(within(first).getByRole('button', { name: /cancel/i }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(calls).toEqual([])

    // Confirmar: se guarda.
    const second = await pick()
    await user.click(within(second).getByRole('button', { name: 'Change method' }))
    await waitFor(() => expect(calls).toEqual([member.id]))
  })

  it('sin permiso muestra badges; sin organización o con backend viejo no hay columna', async () => {
    const { unmount } = renderTable([member, { ...self, id: 'other', email: 'other@example.com' } as User])
    expect(await screen.findByText('Microsoft Contoso')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('Sign-in method')).toBeInTheDocument()
    unmount()

    // Backend anterior al SSO: `users_with_roles` no trae `auth_type`.
    const { unmount: unmountLegacy } = renderTable([activeUser])
    await screen.findByText(activeUser.email)
    expect(screen.queryByText('Sign-in method')).not.toBeInTheDocument()
    unmountLegacy()

    renderTable([member], { organizationId: undefined })
    await screen.findByText(member.email)
    expect(screen.queryByText('Sign-in method')).not.toBeInTheDocument()
  })
})
