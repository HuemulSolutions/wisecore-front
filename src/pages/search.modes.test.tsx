/**
 * /search con tres modos: Clásica (/search/), Avanzada (/search/passages) y Profunda
 * (/search/passages con high_precision), más la vista agrupada por activo.
 */
import { http } from 'msw'
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import SearchPage from '@/pages/search'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondApiError, respondOk } from '@/test/msw/respond'
import { activeUser, ORG_A_ID } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import type { SearchPassage } from '@/types/search'

const session = { token: makeLoginToken({ sub: activeUser.id }), user: activeUser }
const org = { id: ORG_A_ID, token: makeOrgToken({ sub: activeUser.id, permissions: ['search:c', 'asset:r', 'asset:l'] }) }

function passage(id: string, rank: number, documentId: string, section: string): SearchPassage {
  return {
    passage_id: id,
    rank,
    score: 1 / rank,
    source_kind: 'section_output',
    text: `Fragmento ${id}`,
    snippet: `Fragmento ${id}`,
    context: null,
    citation: {
      document_id: documentId,
      document_name: `Reglamento ${documentId}`,
      internal_code: null,
      document_type_id: null,
      document_type_name: null,
      execution_id: `ex-${documentId}`,
      execution_name: null,
      version_string: null,
      lifecycle_state: null,
      section_execution_id: null,
      section_id: `sec-${id}`,
      section_name: section,
      heading_path: [],
      url: null,
    },
    media: [],
    related_assets: [],
  }
}

const response = (passages: SearchPassage[], extra: Record<string, unknown> = {}) => ({
  search_log_id: null,
  query: 'vacaciones',
  version_scope: 'official',
  lifecycle_states: null,
  search_in: ['executions'],
  high_precision: { requested: false, applied: false, llm_name: null, error: null },
  passages,
  timings_ms: {},
  page: 1,
  page_size: 12,
  has_next: false,
  ...extra,
})

describe('SearchPage · modos', () => {
  it('abre en Avanzada: pide pasajes sin high_precision', async () => {
    const urls: URL[] = []
    server.use(
      http.get(`${backendUrl}/search/passages`, ({ request }) => {
        urls.push(new URL(request.url))
        return respondOk(response([passage('p1', 1, 'A', 'Feriado anual')]))
      }),
    )
    renderWithProviders(<SearchPage />, { session, org, route: '/search?q=vacaciones' })
    expect(await screen.findByText('Reglamento A')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Advanced' })).toHaveAttribute('aria-checked', 'true')
    expect(urls[0].searchParams.get('high_precision')).toBe('false')
    expect(urls[0].searchParams.get('page')).toBe('1')
  })

  it('Profunda sin LLM de rerank ofrece buscar en Avanzada', async () => {
    const precision: string[] = []
    server.use(
      http.get(`${backendUrl}/search/passages`, ({ request }) => {
        const hp = new URL(request.url).searchParams.get('high_precision') ?? ''
        precision.push(hp)
        if (hp === 'true') {
          return respondApiError(503, 'RERANK_LLM_NOT_CONFIGURED', 'High precision search is not available')
        }
        return respondOk(response([passage('p1', 1, 'A', 'Feriado anual')]))
      }),
    )
    const { user } = renderWithProviders(<SearchPage />, { session, org, route: '/search?q=vacaciones&mode=deep' })
    await user.click(await screen.findByRole('button', { name: 'Search in Advanced mode' }))
    expect(await screen.findByText('Reglamento A')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Advanced' })).toHaveAttribute('aria-checked', 'true')
    expect(precision).toContain('true')
    expect(precision.at(-1)).toBe('false')
  })

  it('agrupado por activo junta los fragmentos de cada activo y pide 30 por página', async () => {
    const sizes: string[] = []
    server.use(
      http.get(`${backendUrl}/search/passages`, ({ request }) => {
        sizes.push(new URL(request.url).searchParams.get('page_size') ?? '')
        return respondOk(
          response([
            passage('p1', 1, 'A', 'Feriado anual'),
            passage('p2', 2, 'B', 'Permisos'),
            passage('p3', 3, 'A', 'Días hábiles'),
          ]),
        )
      }),
    )
    renderWithProviders(<SearchPage />, { session, org, route: '/search?q=vacaciones&group=asset' })
    const title = await screen.findByText('Reglamento A')
    const card = title.closest('[data-slot="card"]') as HTMLElement
    expect(within(card).getAllByTestId('search-passage-group-item')).toHaveLength(2)
    expect(within(card).getByText('Días hábiles')).toBeInTheDocument()
    expect(screen.getByText('Reglamento B')).toBeInTheDocument()
    expect(sizes.at(-1)).toBe('30')
  })

  it('la Clásica usa /search/ y lleva el primer tipo de activo elegido', async () => {
    const classic: URL[] = []
    server.use(
      http.get(`${backendUrl}/search/passages`, () => respondOk(response([]))),
      http.get(`${backendUrl}/search/`, ({ request }) => {
        classic.push(new URL(request.url))
        return respondOk([])
      }),
    )
    const { user } = renderWithProviders(<SearchPage />, {
      session,
      org,
      route: '/search?q=vacaciones&document_type_ids=t1&document_type_ids=t2&tag_id=g1&tag_id=g2',
    })
    await user.click(await screen.findByRole('radio', { name: 'Classic' }))
    await waitFor(() => expect(classic.length).toBeGreaterThan(0))
    const last = classic.at(-1)!
    expect(last.searchParams.get('document_type_id')).toBe('t1')
    expect(last.searchParams.getAll('tag_id')).toEqual(['g1', 'g2'])
  })
})
