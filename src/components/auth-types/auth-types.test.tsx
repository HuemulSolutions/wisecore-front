/**
 * Plan SSO frontend (docs/sso-frontend.md) · Fase 5 · admin de conexiones y RBAC.
 */
import { delay, http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import AuthTypesPage from '@/pages/auth-types'
import { AuthTypeFormDialog } from '@/components/auth-types/auth-types-form-dialog'
import { AuthTypesTable } from '@/components/auth-types/auth-types-table'
import { useOrganization } from '@/contexts/organization-context'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import {
  activeUser,
  GOOGLE_CONNECTION_ID,
  INTERNAL_CONNECTION_ID,
  internalConnectionOrgB,
  MICROSOFT_CONNECTION_ID,
  ORG_A_ID,
  ORG_B_ID,
  rootAdmin,
} from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import type { AuthType } from '@/types/auth-types'

const connections: AuthType[] = [
  {
    id: INTERNAL_CONNECTION_ID,
    name: 'Internal Authentication',
    type: 'internal',
    params: null,
    organization_id: ORG_A_ID,
    is_active: true,
    email_domains: [],
    has_client_secret: false,
    is_sso: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: MICROSOFT_CONNECTION_ID,
    name: 'Microsoft Contoso',
    type: 'microsoft',
    params: { client_id: 'app-1', tenant_id: null, allowed_tenant_ids: ['t1'], auto_provision: 'off' },
    organization_id: ORG_A_ID,
    is_active: true,
    email_domains: ['contoso.example.com', 'b.example.com', 'c.example.com'],
    has_client_secret: true,
    is_sso: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: GOOGLE_CONNECTION_ID,
    name: 'Google Workspace',
    type: 'google',
    params: { client_id: 'g-1', allowed_hosted_domains: ['contoso.example.com'], auto_provision: 'active' },
    organization_id: ORG_A_ID,
    is_active: false,
    email_domains: [],
    has_client_secret: false,
    is_sso: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
]

function useConnections(list: unknown[] = connections) {
  server.use(
    http.get(`${backendUrl}/auth_types/`, () => respondOk(list)),
    http.get(`${backendUrl}/organizations`, () => respondOk([{ id: ORG_A_ID, name: 'Org A' }], { page: 1, page_size: 200, has_next: false })),
  )
}

const rootSession = { token: makeLoginToken({ sub: rootAdmin.id, is_root_admin: true }), user: rootAdmin }
// El root admin también opera con un token de organización: la lista es de ESA organización.
const rootOrg = { id: ORG_A_ID, token: makeOrgToken({ sub: rootAdmin.id, is_root_admin: true, permissions: [] }) }
const orgAdminSession = { token: makeLoginToken({ sub: activeUser.id }), user: activeUser }
const orgAdminOrg = { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, is_org_admin: true, permissions: [] }) }
const plainUserOrg = { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, is_org_admin: false, permissions: ['asset:r'] }) }

describe('AuthTypes · página y RBAC', () => {
  it('muestra tipo, dominios, estado y secreto por conexión (sin columna de ámbito: todas son de la org activa)', async () => {
    useConnections()
    renderWithProviders(<AuthTypesPage />, { session: rootSession, org: rootOrg, route: `/${ORG_A_ID}/auth-types` })

    const table = await screen.findByRole('table')
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3)

    const microsoft = rows.find((r) => within(r).queryByText('Microsoft Contoso'))!
    expect(within(microsoft).getByText('Microsoft Entra ID')).toBeInTheDocument()
    expect(within(microsoft).queryByText('Org A')).not.toBeInTheDocument()
    expect(within(microsoft).getByText('contoso.example.com')).toBeInTheDocument()
    expect(within(microsoft).getByText('+1')).toBeInTheDocument()
    expect(within(microsoft).getByText('Active')).toBeInTheDocument()
    expect(within(microsoft).getByText('Configured')).toBeInTheDocument()

    const google = rows.find((r) => within(r).queryByText('Google Workspace'))!
    expect(within(google).getByText('Inactive')).toBeInTheDocument()
    expect(within(google).getByText('Missing')).toBeInTheDocument()

    // Toda conexión es de una organización: la INTERNAL es la de Org A y se marca como integrada.
    const internal = rows.find((r) => within(r).queryByText('Internal Authentication'))!
    expect(within(internal).getByText('Built-in')).toBeInTheDocument()
    expect(within(table).queryByText('Global')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Filter by organization' })).not.toBeInTheDocument()
  })

  it('el root admin pide solo las de la organización activa: token de organización, X-Org-Id y sin organization_id', async () => {
    const requests: Array<{ orgParam: string | null; orgHeader: string | null; auth: string | null }> = []
    useConnections()
    server.use(
      http.get(`${backendUrl}/auth_types/`, ({ request }) => {
        requests.push({
          orgParam: new URL(request.url).searchParams.get('organization_id'),
          orgHeader: request.headers.get('X-Org-Id'),
          auth: request.headers.get('Authorization'),
        })
        return respondOk(connections)
      }),
    )
    renderWithProviders(<AuthTypesPage />, { session: rootSession, org: rootOrg, route: `/${ORG_A_ID}/auth-types` })

    await screen.findByRole('table')
    expect(requests).toHaveLength(1)
    expect(requests[0].orgParam).toBeNull()
    expect(requests[0].orgHeader).toBe(ORG_A_ID)
    expect(requests[0].auth).toBe(`Bearer ${rootOrg.token}`)
  })

  it('al cambiar de organización con la página montada no se muestran las conexiones de la anterior', async () => {
    const orgBToken = makeOrgToken({ sub: rootAdmin.id, is_root_admin: true, permissions: [] })
    server.use(
      http.get(`${backendUrl}/auth_types/`, async ({ request }) => {
        if (request.headers.get('X-Org-Id') === ORG_B_ID) {
          // Org B tarda: durante la carga no puede quedar la lista de Org A como placeholder.
          await delay(150)
          return respondOk([{ ...internalConnectionOrgB, name: 'Internal Org B' }])
        }
        return respondOk(connections)
      }),
    )
    // La página queda montada al cambiar de organización (misma ruta): se simula el
    // cambio como lo hace el selector, actualizando id y token de organización.
    function SwitchToOrgB() {
      const { setSelectedOrganizationId, setOrganizationToken } = useOrganization()
      return (
        <button
          type="button"
          onClick={() => {
            setOrganizationToken(orgBToken)
            setSelectedOrganizationId(ORG_B_ID)
          }}
        >
          switch to B
        </button>
      )
    }
    const { user } = renderWithProviders(
      <>
        <SwitchToOrgB />
        <AuthTypesPage />
      </>,
      { session: rootSession, org: rootOrg, route: `/${ORG_A_ID}/auth-types` },
    )

    expect(await screen.findByText('Microsoft Contoso')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'switch to B' }))

    // Mientras carga Org B (150 ms) no aparece nada de Org A: se afirma de inmediato,
    // sin esperar, porque el bug era justamente el placeholder durante la carga.
    expect(screen.queryByText('Microsoft Contoso')).not.toBeInTheDocument()
    expect(screen.queryByText('Google Workspace')).not.toBeInTheDocument()
    expect(screen.queryByText('Internal Authentication')).not.toBeInTheDocument()

    // Y al terminar, solo la INTERNAL de Org B.
    expect(await screen.findByText('Internal Org B')).toBeInTheDocument()
    expect(screen.queryByText('Microsoft Contoso')).not.toBeInTheDocument()
  })

  it('el root admin sin organización activa no ve ninguna conexión ni consulta el backend', async () => {
    let calls = 0
    useConnections()
    server.use(http.get(`${backendUrl}/auth_types/`, () => { calls += 1; return respondOk(connections) }))
    renderWithProviders(<AuthTypesPage />, { session: rootSession, route: '/_/auth-types' })

    expect(await screen.findByText('Organization required')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(calls).toBe(0)
  })

  it('un backend viejo sin los campos nuevos se normaliza sin romper la tabla (y nunca como "Global")', async () => {
    useConnections([{ id: 'legacy', name: 'Legacy', type: 'microsoft', params: { client_id: 'x' }, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }])
    renderWithProviders(<AuthTypesPage />, { session: rootSession, org: rootOrg, route: `/${ORG_A_ID}/auth-types` })

    const table = await screen.findByRole('table')
    const row = within(table).getAllByRole('row')[1]
    expect(within(row).getByText('Legacy')).toBeInTheDocument()
    expect(within(row).queryByText('Global')).not.toBeInTheDocument()
    expect(within(row).getByText('Active')).toBeInTheDocument()
    expect(within(row).getByText('Missing')).toBeInTheDocument()
  })

  it('el org admin (token de organización con is_org_admin) ve la página; un usuario común no', async () => {
    useConnections()
    const first = renderWithProviders(<AuthTypesPage />, { session: orgAdminSession, org: orgAdminOrg, route: `/${ORG_A_ID}/auth-types` })
    expect(await screen.findByRole('table')).toBeInTheDocument()
    first.unmount()

    renderWithProviders(<AuthTypesPage />, { session: orgAdminSession, org: plainUserOrg, route: `/${ORG_A_ID}/auth-types` })
    await waitFor(() => expect(screen.queryByRole('table')).not.toBeInTheDocument())
    expect(await screen.findByText(/access denied|no permission|permiso/i)).toBeInTheDocument()
  })
})

describe('AuthTypeFormDialog', () => {
  it('crear microsoft manda client_id, allowed_tenant_ids[] y email_domains[] parseados, el secreto y auto_provision', async () => {
    useConnections()
    const bodies: Array<Record<string, unknown>> = []
    server.use(
      http.post(`${backendUrl}/auth_types/`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return respondOk(connections[1])
      }),
    )
    const { user } = renderWithProviders(<AuthTypeFormDialog open onOpenChange={() => {}} authType={null} canManage />, {
      session: orgAdminSession,
      org: orgAdminOrg,
    })

    await user.type(await screen.findByPlaceholderText('e.g. Microsoft Contoso'), 'Microsoft Contoso')
    await user.type(screen.getByPlaceholderText('Application (client) ID from the identity provider'), 'app-1')
    const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA')
    // Orden de render: allowed_tenant_ids, email_domains.
    await user.type(textareas[0], 't1, t2')
    await user.type(textareas[1], 'Contoso.example.com\n@filial.example.com')
    expect(within(screen.getByTestId('email-domains-preview')).getAllByText(/example\.com/)).toHaveLength(2)
    await user.type(screen.getByPlaceholderText('Paste the client secret'), 's3cr3t')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      name: 'Microsoft Contoso',
      type: 'microsoft',
      is_active: true,
      params: { client_id: 'app-1', tenant_id: null, allowed_tenant_ids: ['t1', 't2'], auto_provision: 'off' },
      email_domains: ['contoso.example.com', 'filial.example.com'],
      client_secret: 's3cr3t',
    })
    // El org admin no elige ámbito: no manda organization_id (el backend usa X-Org-Id).
    expect('organization_id' in bodies[0]).toBe(false)
  })

  it('en alta, sin client_secret no se envía nada y se muestra la validación', async () => {
    useConnections()
    let calls = 0
    server.use(http.post(`${backendUrl}/auth_types/`, () => { calls += 1; return respondOk(connections[1]) }))
    const { user } = renderWithProviders(<AuthTypeFormDialog open onOpenChange={() => {}} authType={null} canManage />, {
      session: orgAdminSession,
      org: orgAdminOrg,
    })
    await user.type(await screen.findByPlaceholderText('e.g. Microsoft Contoso'), 'Sin secreto')
    await user.type(screen.getByPlaceholderText('Application (client) ID from the identity provider'), 'app-1')
    const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA')
    await user.type(textareas[0], 't1')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Client secret is required')).toBeInTheDocument()
    expect(calls).toBe(0)
  })

  it('editar sin tocar el secreto NO manda client_secret y muestra que ya está configurado', async () => {
    useConnections()
    const bodies: Array<Record<string, unknown>> = []
    server.use(
      http.put(`${backendUrl}/auth_types/${MICROSOFT_CONNECTION_ID}`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        return respondOk(connections[1])
      }),
    )
    const { user } = renderWithProviders(<AuthTypeFormDialog open onOpenChange={() => {}} authType={connections[1]} canManage />, {
      session: rootSession,
    })

    const secret = await screen.findByPlaceholderText('•••••••• (configured)')
    expect(secret).toHaveValue('')
    expect(screen.getByText('Leave empty to keep the current secret.')).toBeInTheDocument()

    const name = screen.getByDisplayValue('Microsoft Contoso')
    await user.clear(name)
    await user.type(name, 'Microsoft Contoso 2')
    await user.click(screen.getByRole('button', { name: 'Update' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({ name: 'Microsoft Contoso 2' })
  })

  it('la conexión internal de cada org es de solo lectura: sin acciones; las SSO sí las tienen', async () => {
    useConnections()
    const { user } = renderWithProviders(
      <AuthTypesTable authTypes={connections.slice(0, 2)} onEdit={() => {}} onDelete={() => {}} canManage />,
      { session: rootSession },
    )

    // Solo la fila SSO tiene menú: la internal (PUT/DELETE → 403 en el backend) no ofrece nada.
    const actionButtons = await screen.findAllByRole('button', { name: 'Actions' })
    expect(actionButtons).toHaveLength(1)
    const internalRow = screen.getByText('Internal Authentication').closest('tr') as HTMLElement
    expect(within(internalRow).queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument()

    await user.click(actionButtons[0])
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByText('Edit connection')).toBeInTheDocument()
    expect(within(menu).getByText('Delete connection')).toBeInTheDocument()
  })

  it('la conexión internal no expone params, dominios, secreto ni cambio de tipo', async () => {
    useConnections()
    renderWithProviders(<AuthTypeFormDialog open onOpenChange={() => {}} authType={connections[0]} canManage />, { session: rootSession })

    expect(await screen.findByDisplayValue('Internal Authentication')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Application (client) ID from the identity provider')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Paste the client secret')).not.toBeInTheDocument()
    expect(screen.getByText('Built-in email-code method of this organization. It cannot be edited or removed.')).toBeInTheDocument()
  })

  it('el root admin no elige organización al crear: la conexión nace en la org activa y no se manda organization_id', async () => {
    useConnections()
    const bodies: Array<Record<string, unknown>> = []
    const headers: Array<string | null> = []
    server.use(
      http.post(`${backendUrl}/auth_types/`, async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)
        headers.push(request.headers.get('X-Org-Id'))
        return respondOk(connections[1])
      }),
    )
    const { user } = renderWithProviders(<AuthTypeFormDialog open onOpenChange={() => {}} authType={null} canManage />, {
      session: rootSession,
      org: rootOrg,
    })

    await user.type(await screen.findByPlaceholderText('e.g. Microsoft Contoso'), 'Org MS')
    expect(screen.queryByText('Organization')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: /organization/i })).not.toBeInTheDocument()
    await user.type(screen.getByPlaceholderText('Application (client) ID from the identity provider'), 'app-1')
    const textareas = screen.getAllByRole('textbox').filter((el) => el.tagName === 'TEXTAREA')
    await user.type(textareas[0], 't1')
    await user.type(screen.getByPlaceholderText('Paste the client secret'), 's3cr3t')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect('organization_id' in bodies[0]).toBe(false)
    expect(headers[0]).toBe(ORG_A_ID)
  })

  it('el alta ofrece solo los tipos que el formulario sabe construir (aunque la API devuelva otros)', async () => {
    useConnections()
    server.use(http.get(`${backendUrl}/auth_types/types`, () => respondOk(['internal', 'microsoft', 'google', 'oidc'])))
    const { user } = renderWithProviders(<AuthTypeFormDialog open onOpenChange={() => {}} authType={null} canManage />, { session: rootSession })

    await user.click(await screen.findByLabelText('Type'))
    const options = within(await screen.findByRole('listbox')).getAllByRole('option').map((o) => o.textContent)
    expect(options).toEqual(['Microsoft Entra ID', 'Google'])
  })
})
