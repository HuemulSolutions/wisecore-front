/**
 * "Quién puede verla": pública oculta los accesos; privada separa roles y personas,
 * cada bloque con su buscador.
 */
import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { CollectionAccessSheet } from '@/components/collections/collection-access-sheet'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'

const page = (data: unknown[]) =>
  HttpResponse.json({ data, transaction_id: 't', page: 1, page_size: 50, has_next: false })

function mockAccessApi(existing: unknown[] = []) {
  const calls: { access: unknown; update: unknown } = { access: null, update: null }
  server.use(
    http.get(`${backendUrl}/collections/col-1/access`, () => respondOk(existing)),
    http.get(`${backendUrl}/rbac/roles/with_perm_count`, () =>
      page([{ id: 'r1', name: 'Analistas', description: '', permissions: [], created_at: '', updated_at: '' }]),
    ),
    http.get(`${backendUrl}/user_roles/members`, () =>
      page([{ id: 'u1', name: 'Ana', last_name: 'Pérez', email: 'ana@x.com', photo_url: null }]),
    ),
    http.put(`${backendUrl}/collections/col-1/access`, async ({ request }) => {
      calls.access = await request.json()
      return respondOk([])
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
    // El directorio de miembros se pide para la organización activa.
    { org: { id: 'org-1', token: 'org-token' } },
  )

describe('CollectionAccessSheet', () => {
  it('en privada agrega un rol desde "Roles" y una persona desde "Personas"', async () => {
    const calls = mockAccessApi()
    const { user } = renderSheet(false)

    await user.type(await screen.findByPlaceholderText('Search a role to add...'), 'Anal')
    await user.click(await screen.findByRole('button', { name: /Analistas/ }))
    await user.type(screen.getByPlaceholderText('Search a person by name or email...'), 'Ana')
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(calls.access).not.toBeNull())
    expect(calls.update).toBeNull()
    expect(calls.access).toEqual({
      accesses: [
        { role_id: 'r1', user_id: null, access_level: 'read' },
        { role_id: null, user_id: 'u1', access_level: 'read' },
      ],
    })
  })

  it('al hacerla pública oculta roles y personas, pero conserva los accesos al guardar', async () => {
    const calls = mockAccessApi([{ id: 'a1', role_id: 'r1', user_id: null, access_level: 'admin' }])
    const { user } = renderSheet(false)

    expect(await screen.findByText('Roles')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Public/ }))
    expect(screen.queryByPlaceholderText('Search a role to add...')).not.toBeInTheDocument()
    expect(screen.queryByText('People')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(calls.access).not.toBeNull())
    expect(calls.update).toEqual({ is_public: true })
    expect(calls.access).toEqual({ accesses: [{ role_id: 'r1', user_id: null, access_level: 'admin' }] })
  })
})
