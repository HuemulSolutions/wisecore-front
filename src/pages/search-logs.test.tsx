/**
 * Opiniones de búsqueda (GET /search/logs, PR backend #356): solo org admins.
 */
import { http } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import SearchLogsPage from '@/pages/search-logs'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { activeUser, ORG_A_ID } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'

const session = { token: makeLoginToken({ sub: activeUser.id }), user: activeUser }
const log = {
  id: 'log-1',
  created_at: new Date().toISOString(),
  user_id: activeUser.id,
  query: 'plazo de vacaciones',
  source: 'api',
  version_scope: 'official',
  lifecycle_states: null,
  filters: { document_type_id: ['t1'], high_precision: false },
  passage_ids: ['p-1', 'p-2'],
  scores: [1, 0.8],
  result_count: 2,
  latency_ms: 2300,
  rerank_applied: false,
  feedback_count: 2,
  useful_count: 1,
}

describe('SearchLogsPage', () => {
  it('muestra las búsquedas y, al abrir una, sus opiniones', async () => {
    server.use(
      http.get(`${backendUrl}/search/logs`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('only_with_feedback')).toBe('true')
        return respondOk([log], { page: 1, page_size: 50, has_next: false })
      }),
      http.get(`${backendUrl}/search/logs/:id/feedback`, () =>
        respondOk([
          { id: 'fb-1', passage_id: 'p-2', useful: false, comment: 'faltaba el artículo', user_id: null, created_at: log.created_at },
          { id: 'fb-2', passage_id: null, useful: true, comment: null, user_id: null, created_at: log.created_at },
        ]),
      ),
    )
    const { user } = renderWithProviders(<SearchLogsPage />, {
      session,
      org: { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, is_org_admin: true, permissions: [] }) },
    })
    await user.click(await screen.findByText('plazo de vacaciones'))
    expect(await screen.findByText('faltaba el artículo')).toBeInTheDocument()
    expect(screen.getByText('About result #2')).toBeInTheDocument()
    expect(screen.getByText('About the whole search')).toBeInTheDocument()
  })

  it('un usuario que no es admin de la organización ve el aviso, sin pedir el registro', async () => {
    let called = false
    server.use(
      http.get(`${backendUrl}/search/logs`, () => {
        called = true
        return respondOk([])
      }),
    )
    renderWithProviders(<SearchLogsPage />, {
      session,
      org: { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, is_org_admin: false, permissions: ['search:c'] }) },
    })
    expect(await screen.findByText('Only organization admins can see the search log.')).toBeInTheDocument()
    expect(called).toBe(false)
  })
})
