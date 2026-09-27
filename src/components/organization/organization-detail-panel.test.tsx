/**
 * El panel de organización queda montado al cambiar de fila: el estado del tab
 * "Usuarios" (p. ej. el método del próximo miembro) no debe pasar de una org a otra.
 */
import { useState } from 'react'
import { http } from 'msw'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { OrganizationDetailPanel } from '@/components/organization/organization-detail-panel'
import { useOrganizationDetailsForm } from '@/hooks/useOrganizationDetailsForm'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { googleConnection, internalConnection, microsoftConnection, ORG_A_ID, ORG_B_ID, rootAdmin } from '@/test/fixtures'
import { makeLoginToken } from '@/test/jwt'
import type { Organization } from '@/types/organizations'

const orgA: Organization = { id: ORG_A_ID, name: 'Org A', default_auth_type_id: null }
const orgB: Organization = { id: ORG_B_ID, name: 'Org B', default_auth_type_id: null }

const rootSession = { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin }

function Harness() {
  const [organization, setOrganization] = useState<Organization>(orgA)
  const detailsForm = useOrganizationDetailsForm(organization, true, false, false)
  return (
    <>
      <button type="button" onClick={() => setOrganization(orgB)}>open Org B</button>
      <OrganizationDetailPanel
        organization={organization}
        open
        activeTab="users"
        onTabChange={() => {}}
        onClose={() => {}}
        onDeleteOrganization={() => {}}
        detailsForm={detailsForm}
        canUpdate
        canDelete={false}
        canListUsers
        canSetAdmin
        canManageMembers
        canEditAuthMethod
      />
    </>
  )
}

describe('OrganizationDetailPanel · tab Usuarios', () => {
  it('el método elegido para nuevos miembros no se arrastra a otra organización', async () => {
    server.use(
      http.get(`${backendUrl}/organizations/:orgId/users`, () => respondOk([], { page: 1, page_size: 100, has_next: false })),
      http.get(`${backendUrl}/auth_types/`, () => respondOk([internalConnection, microsoftConnection, googleConnection])),
    )
    const { user } = renderWithProviders(<Harness />, { session: rootSession })

    const methodA = await screen.findByLabelText('Sign-in method for new members')
    await waitFor(() => expect(methodA).toBeEnabled())
    await user.click(methodA)
    await user.click(within(await screen.findByRole('listbox')).getByText('Microsoft Contoso'))
    await waitFor(() => expect(methodA).toHaveTextContent('Microsoft Contoso'))

    // El sheet es modal: el "cambio de fila" se simula fuera de él (en la app lo hace la URL).
    fireEvent.click(screen.getByRole('button', { name: 'open Org B', hidden: true }))

    const methodB = await screen.findByLabelText('Sign-in method for new members')
    await waitFor(() => expect(methodB).toHaveTextContent('Internal Authentication'))
    expect(methodB).not.toHaveTextContent('Microsoft Contoso')
  })
})
