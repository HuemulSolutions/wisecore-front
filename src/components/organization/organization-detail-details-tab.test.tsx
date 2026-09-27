/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 6 · método de autenticación por defecto de la organización.
 */
import { http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { OrganizationDetailDetailsTab } from '@/components/organization/organization-detail-details-tab'
import { useOrganizationDetailsForm } from '@/hooks/useOrganizationDetailsForm'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { googleConnection, internalConnection, INTERNAL_CONNECTION_ID, MICROSOFT_CONNECTION_ID, microsoftConnection, ORG_A_ID, rootAdmin } from '@/test/fixtures'
import { makeLoginToken } from '@/test/jwt'
import type { Organization } from '@/types/organizations'

const rootSession = { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin }

/** Arnés mínimo: el hook real + el tab real + un botón que dispara `save`. */
function Harness({ organization, manageDefault = true }: { organization: Organization; manageDefault?: boolean }) {
  const form = useOrganizationDetailsForm(organization, true, false, manageDefault)
  return (
    <>
      <OrganizationDetailDetailsTab organization={organization} form={form} canManageDefaultAuthMethod={manageDefault} />
      <button type="button" onClick={() => void form.save()} disabled={!form.canSave}>
        save
      </button>
      <output data-testid="dirty">{String(form.isDirty)}</output>
    </>
  )
}

function useConnections() {
  server.use(http.get(`${backendUrl}/auth_types/`, () => respondOk([internalConnection, microsoftConnection, googleConnection])))
}

describe('OrganizationDetailDetailsTab · método por defecto', () => {
  it('cambiar el método por defecto marca el formulario sucio y el PATCH manda default_auth_type_id', async () => {
    useConnections()
    const bodies: Array<Record<string, unknown>> = []
    server.use(
      http.patch(`${backendUrl}/organizations/${ORG_A_ID}`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return respondOk({ id: ORG_A_ID, name: 'Org A', default_auth_type_id: MICROSOFT_CONNECTION_ID })
      }),
    )
    const { user } = renderWithProviders(<Harness organization={{ id: ORG_A_ID, name: 'Org A', default_auth_type_id: null }} />, { session: rootSession })

    const trigger = await screen.findByLabelText('Default sign-in method')
    // `null` se muestra como la conexión interna con la etiqueta "por defecto".
    await waitFor(() => expect(trigger).toHaveTextContent('Email code (default)'))
    expect(screen.getByTestId('dirty')).toHaveTextContent('false')

    await user.click(trigger)
    await user.click(within(await screen.findByRole('listbox')).getByText('Microsoft Contoso'))
    expect(screen.getByTestId('dirty')).toHaveTextContent('true')

    await user.click(screen.getByRole('button', { name: 'save' }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ name: 'Org A', description: null, default_auth_type_id: MICROSOFT_CONNECTION_ID })
  })

  it('sin tocar el método, el PATCH no manda default_auth_type_id', async () => {
    useConnections()
    const bodies: Array<Record<string, unknown>> = []
    server.use(
      http.patch(`${backendUrl}/organizations/${ORG_A_ID}`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return respondOk({ id: ORG_A_ID, name: 'Org A2', default_auth_type_id: INTERNAL_CONNECTION_ID })
      }),
    )
    const { user } = renderWithProviders(
      <Harness organization={{ id: ORG_A_ID, name: 'Org A', default_auth_type_id: INTERNAL_CONNECTION_ID }} />,
      { session: rootSession },
    )

    const name = await screen.findByDisplayValue('Org A')
    await user.type(name, '2')
    await user.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect('default_auth_type_id' in bodies[0]).toBe(false)
  })

  it('sin permiso de root admin el campo no se muestra', async () => {
    renderWithProviders(<Harness organization={{ id: ORG_A_ID, name: 'Org A' }} manageDefault={false} />, { session: rootSession })
    await screen.findByDisplayValue('Org A')
    expect(screen.queryByLabelText('Default sign-in method')).not.toBeInTheDocument()
  })
})
