/**
 * Permisos exactos por pantalla (la ruta se abre con `collection:l` o `collection:r`, pero
 * el listado exige `:l` y el detalle `:r`) y estado de "Agregar a colección" por apertura.
 */
import { http } from 'msw'
import { screen } from '@testing-library/react'
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
