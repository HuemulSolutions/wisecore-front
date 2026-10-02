/**
 * "Quién puede verla": roles y personas, cada bloque con su buscador; en una pública definen
 * quién la administra. El creador es un acceso más y nunca queda sin administradores. Al
 * guardar viajan solo los cambios (`PATCH {add, remove}`), nunca la lista completa.
 */
import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { CollectionAccessSheet } from '@/components/collections/collection-access-sheet'
import { renderWithProviders } from '@/test/render'
import { activeUser } from '@/test/fixtures'
import { makeLoginToken } from '@/test/jwt'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'

const page = (data: unknown[]) =>
  HttpResponse.json({ data, transaction_id: 't', page: 1, page_size: 50, has_next: false })

// El buscador de personas consulta el directorio con debounce real: con la suite completa en
// paralelo la respuesta puede pasar del segundo por defecto de Testing Library.
const NETWORK_WAIT = { timeout: 5000 }

const CREATOR = { user_id: 'creator', name: 'Carla', last_name: 'Creadora', email: 'carla@x.com' }
// El creador administra por su grant, como cualquiera.
const CREATOR_GRANT = {
  id: 'a0', role_id: null, user_id: 'creator', access_level: 'admin',
  user: { name: 'Carla', last_name: 'Creadora', email: 'carla@x.com' }, is_member: true,
}

function mockAccessApi(existing: unknown[] = [CREATOR_GRANT]) {
  const calls: { access: unknown; update: unknown; replaced: boolean } = { access: null, update: null, replaced: false }
  server.use(
    http.get(`${backendUrl}/collections/col-1/access`, () => respondOk({ creator: CREATOR, accesses: existing })),
    http.get(`${backendUrl}/rbac/roles/with_perm_count`, () =>
      page([{ id: 'r1', name: 'Analistas', description: '', permissions: [], created_at: '', updated_at: '' }]),
    ),
    http.get(`${backendUrl}/user_roles/members`, () =>
      page([{ id: 'u1', name: 'Ana', last_name: 'Pérez', email: 'ana@x.com', photo_url: null }]),
    ),
    http.patch(`${backendUrl}/collections/col-1/access`, async ({ request }) => {
      calls.access = await request.json()
      return respondOk({ creator: CREATOR, accesses: [] })
    }),
    // El reemplazo completo ya no existe: si alguien lo llama, el test lo detecta.
    http.put(`${backendUrl}/collections/col-1/access`, () => {
      calls.replaced = true
      return respondOk({ creator: CREATOR, accesses: [] })
    }),
    http.put(`${backendUrl}/collections/col-1`, async ({ request }) => {
      calls.update = await request.json()
      return respondOk({ id: 'col-1' })
    }),
  )
  return calls
}

const renderSheet = (isPublic: boolean) =>
  renderWithProviders(
    <CollectionAccessSheet
      open
      onOpenChange={() => {}}
      collection={{ id: 'col-1', name: 'Inducción', is_public: isPublic, created_by: 'creator' }}
    />,
    // Sesión y organización activas, como en la app: sin `auth_token`, OrganizationProvider
    // limpia la organización al segundo (cree que hubo un logout) y el directorio deja de pedirse.
    {
      session: { token: makeLoginToken({ sub: activeUser.id }), user: activeUser },
      org: { id: 'org-1', token: 'org-token' },
    },
  )

describe('CollectionAccessSheet', () => {
  it('sin escribir muestra solo lo agregado (y al creador por nombre); los roles aparecen al buscar', async () => {
    mockAccessApi()
    const { user } = renderSheet(false)

    const search = await screen.findByPlaceholderText('Search a role to add...')
    expect(await screen.findByText('No roles have access yet.')).toBeInTheDocument()
    expect(screen.getByText('Carla Creadora')).toBeInTheDocument()
    expect(screen.getByText('Creator')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Analistas/ })).not.toBeInTheDocument()

    await user.type(search, 'xyz')
    expect(await screen.findByText('No results')).toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'anal')
    await user.click(await screen.findByRole('button', { name: /Analistas/ }))

    // Agregado: queda en la lista y el desplegable se cierra.
    expect(screen.queryByText('No roles have access yet.')).not.toBeInTheDocument()
    expect(screen.getByText('Analistas')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Analistas/ })).not.toBeInTheDocument()
  })

  it('agregar un rol y una persona manda solo esos dos en `add`', async () => {
    const calls = mockAccessApi()
    const { user } = renderSheet(false)

    await user.type(await screen.findByPlaceholderText('Search a role to add...'), 'Anal')
    await user.click(await screen.findByRole('button', { name: /Analistas/ }))
    await user.type(screen.getByPlaceholderText('Search a person by name or email...'), 'Ana')
    // El directorio se busca en el servidor con debounce.
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }, NETWORK_WAIT))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(calls.access).not.toBeNull(), NETWORK_WAIT)
    expect(calls.update).toBeNull()
    expect(calls.replaced).toBe(false)
    expect(calls.access).toEqual({
      add: [
        { role_id: 'r1', user_id: null, access_level: 'read' },
        { role_id: null, user_id: 'u1', access_level: 'read' },
      ],
      remove: [],
    })
  })

  it('quitar un acceso manda solo ese en `remove`; los que no cambian no viajan', async () => {
    const calls = mockAccessApi([
      { id: 'a1', role_id: 'r1', user_id: null, access_level: 'admin', role_name: 'Analistas' },
      {
        id: 'a2', role_id: null, user_id: 'gone', access_level: 'read',
        user: { name: 'Beto', last_name: 'Ido', email: 'beto@x.com' }, is_member: false,
      },
    ])
    const { user } = renderSheet(false)

    // El ex miembro aparece por nombre, marcado, y se puede quitar.
    expect(await screen.findByText('Beto Ido')).toBeInTheDocument()
    expect(screen.getByText('No longer a member')).toBeInTheDocument()
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' })
    await user.click(removeButtons[removeButtons.length - 1])
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(calls.access).not.toBeNull(), NETWORK_WAIT)
    expect(calls.access).toEqual({ add: [], remove: [{ role_id: null, user_id: 'gone' }] })
  })

  it('al hacerla pública sigue mostrando quiénes la administran y no toca los accesos', async () => {
    const calls = mockAccessApi([{ id: 'a1', role_id: 'r1', user_id: null, access_level: 'admin', role_name: 'Analistas' }])
    const { user } = renderSheet(false)

    expect(await screen.findByText('Roles')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Public/ }))
    expect(screen.getByText('Who manages it')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search a role to add...')).toBeInTheDocument()
    expect(screen.getByText('People')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(calls.update).toEqual({ is_public: true }), NETWORK_WAIT)
    expect(calls.access).toBeNull()
    expect(calls.replaced).toBe(false)
  })

  it('en una pública lo que se agrega es un administrador', async () => {
    const calls = mockAccessApi()
    const { user } = renderSheet(true)

    await user.type(await screen.findByPlaceholderText('Search a role to add...'), 'Anal')
    await user.click(await screen.findByRole('button', { name: /Analistas/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(calls.access).not.toBeNull(), NETWORK_WAIT)
    expect(calls.access).toEqual({ add: [{ role_id: 'r1', user_id: null, access_level: 'admin' }], remove: [] })
  })

  it('al único administrador no se lo puede quitar; con otro, se puede quitar al creador', async () => {
    const calls = mockAccessApi()
    const { user } = renderSheet(false)

    expect(await screen.findByText('Carla Creadora')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Search a role to add...'), 'Anal')
    await user.click(await screen.findByRole('button', { name: /Analistas/ }))
    // El rol entra como lectura: el creador sigue siendo el único administrador.
    expect(screen.getAllByRole('button', { name: 'Remove' })[1]).toBeDisabled()
    await user.click(screen.getAllByRole('combobox', { name: 'Access level' })[0])
    await user.click(await screen.findByRole('option', { name: 'Manage' }))

    const creatorRemove = screen.getAllByRole('button', { name: 'Remove' })[1]
    expect(creatorRemove).toBeEnabled()
    await user.click(creatorRemove)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(calls.access).not.toBeNull(), NETWORK_WAIT)
    expect(calls.access).toEqual({
      add: [{ role_id: 'r1', user_id: null, access_level: 'admin' }],
      remove: [{ role_id: null, user_id: 'creator' }],
    })
  })

  it('si no se pudieron cargar los accesos muestra el error y no deja guardar', async () => {
    const calls = mockAccessApi()
    server.use(
      http.get(`${backendUrl}/collections/col-1/access`, () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'boom', detail: '' } }, { status: 500 }),
      ),
    )
    renderSheet(false)

    expect(await screen.findByRole('button', { name: 'Try Again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(calls.access).toBeNull()
  })
})
