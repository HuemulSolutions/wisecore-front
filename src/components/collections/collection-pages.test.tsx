/**
 * Permisos exactos por pantalla (la ruta se abre con `collection:l` o `collection:r`, pero
 * el listado exige `:l` y el detalle `:r`) y estado de "Agregar a colección" por apertura.
 */
import { http } from 'msw'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

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

const renderDetail = (route = '/collections/col-1') => {
  server.use(
    http.get(`${backendUrl}/collections/col-1`, () => respondOk(ADMIN_DETAIL)),
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

  it('el modo lector oculta la edición a quien administra y se puede volver', async () => {
    const { user } = renderDetail()

    expect(await screen.findByRole('button', { name: 'More actions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New group' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'View as reader' }))

    expect(await screen.findByText(/You are viewing the collection as a reader/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'More actions' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'New group' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to editing' }))
    expect(await screen.findByRole('button', { name: 'More actions' })).toBeInTheDocument()
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
