/**
 * "Agregar activos" desde la colección y "Quién puede verla" (visibilidad + roles y
 * personas desde un buscador único).
 */
import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { CollectionAddItemsSheet } from '@/components/collections/collection-add-items-sheet'
import { CollectionAccessSheet } from '@/components/collections/collection-access-sheet'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'

const page = (data: unknown[]) =>
  HttpResponse.json({ data, transaction_id: 't', page: 1, page_size: 50, has_next: false })

describe('CollectionAddItemsSheet', () => {
  it('marca los que ya están y agrega los elegidos, en orden, al grupo elegido', async () => {
    const posts: unknown[] = []
    server.use(
      http.get(`${backendUrl}/documents/`, () =>
        page([
          { id: 'd1', name: 'Política de seguridad', internal_code: 'POL-1' },
          { id: 'd2', name: 'Procedimiento de altas', internal_code: 'PRO-2' },
          { id: 'd3', name: 'Manual de uso', internal_code: null },
        ]),
      ),
      http.post(`${backendUrl}/collections/col-1/items`, async ({ request }) => {
        const body = await request.json()
        posts.push(body)
        return respondOk({ id: `i-${posts.length}`, ...(body as object) })
      }),
    )
    const { user } = renderWithProviders(
      <CollectionAddItemsSheet
        open
        onOpenChange={() => {}}
        detail={{
          id: 'col-1',
          name: 'Inducción',
          groups: [],
          items: [{ id: 'i0', document_id: 'd1', group_id: null, position: 0, title: 'x', internal_code: null, document_type_id: null, version: null }],
        }}
      />,
    )

    expect(await screen.findByText('Política de seguridad')).toBeInTheDocument()
    expect(screen.getByText('Already added')).toBeInTheDocument()

    await user.click(screen.getByText('Manual de uso'))
    await user.click(screen.getByText('Procedimiento de altas'))
    await user.click(screen.getByRole('button', { name: 'Add (2)' }))

    await waitFor(() => expect(posts).toHaveLength(2))
    expect(posts).toEqual([
      { document_id: 'd3', group_id: null },
      { document_id: 'd2', group_id: null },
    ])
  })
})

describe('CollectionAccessSheet', () => {
  it('hace pública la colección y agrega un rol y una persona desde el buscador', async () => {
    let accessBody: unknown = null
    let updateBody: unknown = null
    server.use(
      http.get(`${backendUrl}/collections/col-1/access`, () => respondOk([])),
      http.get(`${backendUrl}/rbac/roles/with_perm_count`, () =>
        page([{ id: 'r1', name: 'Analistas', description: '', permissions: [], created_at: '', updated_at: '' }]),
      ),
      http.get(`${backendUrl}/user_roles/members`, () =>
        page([{ id: 'u1', name: 'Ana', last_name: 'Pérez', email: 'ana@x.com', photo_url: null }]),
      ),
      http.put(`${backendUrl}/collections/col-1/access`, async ({ request }) => {
        accessBody = await request.json()
        return respondOk([])
      }),
      http.put(`${backendUrl}/collections/col-1`, async ({ request }) => {
        updateBody = await request.json()
        return respondOk({ id: 'col-1' })
      }),
    )
    const { user } = renderWithProviders(
      <CollectionAccessSheet
        open
        onOpenChange={() => {}}
        collection={{ id: 'col-1', name: 'Inducción', is_public: false, created_by: 'creator' }}
      />,
      // El directorio de miembros se pide para la organización activa.
      { org: { id: 'org-1', token: 'org-token' } },
    )

    await user.click(screen.getByRole('radio', { name: /Public/ }))
    const search = screen.getByPlaceholderText('Search a role or person to add...')
    await user.type(search, 'Anal')
    await user.click(await screen.findByRole('button', { name: /Analistas/ }))
    await user.type(search, 'Ana')
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(accessBody).not.toBeNull())
    expect(updateBody).toEqual({ is_public: true })
    expect(accessBody).toEqual({
      accesses: [
        { role_id: 'r1', user_id: null, access_level: 'read' },
        { role_id: null, user_id: 'u1', access_level: 'read' },
      ],
    })
  })
})
