/**
 * Permisos exactos por pantalla (la ruta se abre con `collection:l` o `collection:r`, pero
 * el listado exige `:l` y el detalle `:r`) y estado de "Agregar a colección" por apertura.
 */
import { http } from 'msw'
import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import CollectionsPage from '@/pages/collections'
import CollectionDetailPage from '@/pages/collection-detail'
import { AddToCollectionSheet } from '@/components/collections/add-to-collection-sheet'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { activeUser, ORG_A_ID } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'

const session = { token: makeLoginToken({ sub: activeUser.id }), user: activeUser }
const orgWith = (permissions: string[]) => ({
  id: ORG_A_ID,
  token: makeOrgToken({ sub: activeUser.id, is_org_admin: false, permissions }),
})

function trackCollectionRequests() {
  const requested: string[] = []
  server.use(
    http.get(`${backendUrl}/collections/`, ({ request }) => {
      requested.push(new URL(request.url).pathname)
      return respondOk([])
    }),
    http.get(`${backendUrl}/collections/:id`, ({ request }) => {
      requested.push(new URL(request.url).pathname)
      return respondOk(null)
    }),
  )
  return requested
}

describe('Colecciones · permisos por pantalla', () => {
  it('sin collection:l el listado muestra acceso denegado y no llama al backend', async () => {
    const requested = trackCollectionRequests()
    renderWithProviders(<CollectionsPage />, { session, org: orgWith(['collection:r']) })

    expect(await screen.findByText('Access Denied')).toBeInTheDocument()
    expect(requested).toEqual([])
  })

  it('sin collection:r el detalle muestra acceso denegado y no llama al backend', async () => {
    const requested = trackCollectionRequests()
    renderWithProviders(<CollectionDetailPage />, { session, org: orgWith(['collection:l']) })

    expect(await screen.findByText('Access Denied')).toBeInTheDocument()
    expect(requested).toEqual([])
  })
})

const ADMIN_DETAIL = {
  id: 'col-1',
  name: 'Inducción',
  description: 'Para quien entra',
  instructions: 'Lee en orden.',
  show_instructions_in_menu: true,
  is_public: true,
  for_agent: false,
  agent_slug: null,
  agent_usage: null,
  agent_kind: 'knowledge',
  created_by: activeUser.id,
  updated_by: null,
  created_at: null,
  updated_at: null,
  can_admin: true,
  groups: [],
  items: [],
  hidden_item_count: 0,
}

const renderDetail = (route = '/collections/col-1', detail: Record<string, unknown> = ADMIN_DETAIL) => {
  server.use(
    http.get(`${backendUrl}/collections/col-1`, () => respondOk(detail)),
    http.get(`${backendUrl}/collections/col-1/access`, () => respondOk({ creator: null, accesses: [] })),
  )
  return renderWithProviders(
    <Routes>
      <Route path="/collections/:collectionId" element={<CollectionDetailPage />} />
    </Routes>,
    { session, route, org: orgWith(['collection:r', 'collection:u', 'collection:d', 'collection:l']) },
  )
}

describe('CollectionDetailPage', () => {
  it('con las reglas en el menú, la portada no las repite y el índice las ofrece aparte', async () => {
    const { user } = renderDetail()

    expect(await screen.findByText('Para quien entra')).toBeInTheDocument()
    expect(screen.queryByText('Lee en orden.')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'General rules' }))
    expect(await screen.findByText('Lee en orden.')).toBeInTheDocument()
  })

  // El menú ⋯ de la cabecera es el primero de la pantalla. Radix lo abre con pointerdown o
  // teclado; en jsdom, por teclado.
  const openMenu = async (user: ReturnType<typeof renderDetail>['user'], trigger: HTMLElement) => {
    trigger.focus()
    await user.keyboard('{Enter}')
  }
  const headerMenu = async () => (await screen.findAllByRole('button', { name: 'More actions' }))[0]

  it('quien administra entra en Diseño y desde ⋯ pasa a Elaborador y vuelve', async () => {
    const { user } = renderDetail()

    expect(await screen.findByRole('button', { name: 'New group' })).toBeInTheDocument()
    await openMenu(user, await headerMenu())
    expect(screen.getByRole('menuitemradio', { name: /^Design/ })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('menuitemradio', { name: /^Author/ }))

    expect(await screen.findByText(/Author mode: the collection as everyone else sees it/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'New group' })).not.toBeInTheDocument()

    await openMenu(user, await headerMenu())
    await user.click(screen.getByRole('menuitemradio', { name: /^Design/ }))
    expect(await screen.findByRole('button', { name: 'New group' })).toBeInTheDocument()
  })

  it('sin administrar entra en Consulta, un link de Diseño también, y puede pasar a Elaborador', async () => {
    const { user } = renderDetail('/collections/col-1?view=design', { ...ADMIN_DETAIL, can_admin: false })

    expect(await screen.findByText(/Consult mode: assets are shown without editing actions/)).toBeInTheDocument()
    await openMenu(user, await headerMenu())
    expect(screen.getByRole('menuitemradio', { name: /^Consult/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('menuitemradio', { name: /^Author/ })).toBeInTheDocument()
    expect(screen.queryByRole('menuitemradio', { name: /^Design/ })).not.toBeInTheDocument()
  })

  it('el link se comparte en todos los modos, con los modos que permite el rol', async () => {
    const { user } = renderDetail('/collections/col-1?view=consult', { ...ADMIN_DETAIL, can_admin: false })
    // user-event instala su propio portapapeles al crearse: se espía después de renderizar.
    const writeText = vi.spyOn(navigator.clipboard, 'writeText')
    await openMenu(user, await screen.findByRole('button', { name: 'Copy link' }))
    expect(screen.queryByRole('menuitem', { name: 'Design' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Author' }))

    expect(writeText).toHaveBeenCalledTimes(1)
    expect(new URL(writeText.mock.calls[0][0]).searchParams.get('view')).toBe('author')
  })

  it('quien administra comparte también Diseño', async () => {
    const { user } = renderDetail('/collections/col-1?view=consult')
    await openMenu(user, await screen.findByRole('button', { name: 'Copy link' }))
    expect(screen.getByRole('menuitem', { name: 'Design' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Consult' })).toBeInTheDocument()
  })

  it('una sub-colección se ve como un grupo y su menú ofrece editarla solo si la administra', async () => {
    const child = (id: string, name: string, canAdmin: boolean) => ({
      id: `item-${id}`,
      kind: 'collection',
      document_id: null,
      child_collection_id: id,
      group_id: null,
      position: 0,
      title: name,
      is_home: false,
      collection: { id, name, description: null, for_agent: false, item_count: 0, can_admin: canAdmin },
    })
    server.use(
      http.get(`${backendUrl}/collections/:id`, ({ params }) =>
        respondOk({
          ...ADMIN_DETAIL,
          id: params.id,
          name: String(params.id),
          can_admin: false,
          items: [
            {
              id: `asset-in-${params.id}`,
              kind: 'document',
              document_id: `doc-${params.id}`,
              child_collection_id: null,
              group_id: null,
              position: 0,
              title: `Activo de ${params.id}`,
              internal_code: `COD-${params.id}`,
              document_type_id: null,
              is_home: false,
              version: { execution_id: 'e', name: 'Version 1', version: '2.1.0', lifecycle_state: 'published', pinned: false },
            },
          ],
        }),
      ),
    )
    const { user } = renderDetail('/collections/col-1?view=author', {
      ...ADMIN_DETAIL,
      items: [child('mine', 'Mía', true), { ...child('other', 'Ajena', false), position: 1 }],
    })

    const mine = await screen.findByRole('button', { name: 'Mía' })
    expect(mine).toHaveAttribute('aria-expanded', 'true')
    const other = screen.getByRole('button', { name: 'Ajena' })
    // Sus activos se ven igual que los de la colección: con código y versión.
    expect(await screen.findByText('COD-mine')).toBeInTheDocument()
    expect(screen.getAllByText('· 2.1.0').length).toBeGreaterThan(0)
    // Solo la que administra tiene ⋯; en Elaborador no hay mover ni quitar.
    const mineRow = mine.closest('li')!
    expect(within(other.closest('li')!).queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument()
    await openMenu(user, within(mineRow).getAllByRole('button', { name: 'More actions' })[0])
    expect(await screen.findByRole('menuitem', { name: 'Edit collection' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Remove from collection' })).not.toBeInTheDocument()

    await user.keyboard('{Escape}')
    await user.click(mine)
    expect(mine).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('AddToCollectionSheet', () => {
  it('cada apertura empieza de cero: "fijar versión" no se arrastra al siguiente activo', async () => {
    server.use(http.get(`${backendUrl}/collections/`, () => respondOk([])))
    const props = { onOpenChange: () => {}, documentName: 'Activo', executionId: 'exec-1' }
    const { user, rerender } = renderWithProviders(<AddToCollectionSheet open documentId="doc-1" {...props} />, {
      session,
      org: orgWith(['collection:l', 'collection:u']),
    })

    const pin = await screen.findByRole('checkbox')
    await user.click(pin)
    expect(pin).toBeChecked()

    rerender(<AddToCollectionSheet open={false} documentId="doc-1" {...props} />)
    rerender(<AddToCollectionSheet open documentId="doc-2" {...props} />)
    expect(await screen.findByRole('checkbox')).not.toBeChecked()
  })
})
