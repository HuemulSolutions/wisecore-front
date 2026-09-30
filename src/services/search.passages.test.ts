/**
 * Servicio de búsqueda por pasajes (PR backend #356): listas como parámetros repetidos,
 * 503 sin LLM de rerank y feedback.
 */
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { createSearchFeedback, searchPassages } from '@/services/search'
import { ApiError } from '@/types/api-error'
import { server } from '@/test/msw/server'
import { respondApiError, respondOk } from '@/test/msw/respond'

const EMPTY_RESPONSE = {
  search_log_id: 'log-1',
  query: 'vacaciones',
  version_scope: 'official',
  lifecycle_states: null,
  search_in: ['executions', 'media'],
  high_precision: { requested: true, applied: true, llm_name: 'gpt-6-luna', error: null },
  passages: [],
  timings_ms: {},
}

describe('services/search · pasajes', () => {
  it('arma las listas como parámetros repetidos y manda la organización', async () => {
    let url: URL | null = null
    let orgHeader: string | null = null
    server.use(
      http.get(`${backendUrl}/search/passages`, ({ request }) => {
        url = new URL(request.url)
        orgHeader = request.headers.get('X-Org-Id')
        return respondOk(EMPTY_RESPONSE)
      }),
    )
    const result = await searchPassages({
      organizationId: 'org-1',
      query: 'vacaciones',
      documentTypeIds: ['t1', 't2'],
      lifecycleStates: ['published'],
      searchIn: ['executions', 'media'],
      highPrecision: true,
      versionScope: 'latest',
    })
    expect(orgHeader).toBe('org-1')
    expect(url!.searchParams.getAll('document_type_id')).toEqual(['t1', 't2'])
    expect(url!.searchParams.getAll('search_in')).toEqual(['executions', 'media'])
    expect(url!.searchParams.getAll('lifecycle_state')).toEqual(['published'])
    expect(url!.searchParams.get('high_precision')).toBe('true')
    expect(url!.searchParams.get('version_scope')).toBe('latest')
    expect(result.high_precision.llm_name).toBe('gpt-6-luna')
  })

  it('manda los filtros del buscador anterior y la paginación', async () => {
    let url: URL | null = null
    server.use(
      http.get(`${backendUrl}/search/passages`, ({ request }) => {
        url = new URL(request.url)
        return respondOk({ ...EMPTY_RESPONSE, page: 2, page_size: 30, has_next: true })
      }),
    )
    const result = await searchPassages({
      organizationId: 'org-1',
      query: 'vacaciones',
      tagIds: ['tag-1', 'tag-2'],
      createdBy: 'user-1',
      hasUnresolvedComments: true,
      hasPendingAiSuggestion: false,
      businessDates: { expiration_date_from: '2027-01-01', audit_date: '2027-05-01' },
      page: 2,
      pageSize: 30,
    })
    expect(url!.searchParams.getAll('tag_id')).toEqual(['tag-1', 'tag-2'])
    expect(url!.searchParams.get('created_by')).toBe('user-1')
    expect(url!.searchParams.get('has_unresolved_comments')).toBe('true')
    expect(url!.searchParams.get('has_pending_ai_suggestion')).toBe('false')
    expect(url!.searchParams.get('expiration_date_from')).toBe('2027-01-01')
    expect(url!.searchParams.get('audit_date')).toBe('2027-05-01')
    expect(url!.searchParams.get('page')).toBe('2')
    expect(url!.searchParams.get('page_size')).toBe('30')
    expect(url!.searchParams.has('top_k')).toBe(false)
    expect(result.has_next).toBe(true)
  })

  it('sin paginar sigue mandando top_k (chatbot, MCP y SDK)', async () => {
    let url: URL | null = null
    server.use(
      http.get(`${backendUrl}/search/passages`, ({ request }) => {
        url = new URL(request.url)
        return respondOk(EMPTY_RESPONSE)
      }),
    )
    await searchPassages({ organizationId: 'org-1', query: 'x' })
    expect(url!.searchParams.get('top_k')).toBe('12')
    expect(url!.searchParams.has('page')).toBe(false)
    expect(url!.searchParams.has('tag_id')).toBe(false)
  })

  it('propaga el 503 con su código cuando la organización no eligió LLM de rerank', async () => {
    server.use(
      http.get(`${backendUrl}/search/passages`, () =>
        respondApiError(503, 'RERANK_LLM_NOT_CONFIGURED', 'High precision search is not available'),
      ),
    )
    const error = await searchPassages({ organizationId: 'org-1', query: 'x', highPrecision: true }).catch((e) => e)
    expect(ApiError.isApiError(error)).toBe(true)
    expect((error as ApiError).code).toBe('RERANK_LLM_NOT_CONFIGURED')
  })

  it('envía el feedback de un pasaje', async () => {
    let body: unknown = null
    server.use(
      http.post(`${backendUrl}/search/feedback`, async ({ request }) => {
        body = await request.json()
        return respondOk({ id: 'fb-1' })
      }),
    )
    await createSearchFeedback('org-1', { search_log_id: 'log-1', passage_id: 'p-1', useful: false, comment: 'faltó' })
    expect(body).toEqual({ search_log_id: 'log-1', passage_id: 'p-1', useful: false, comment: 'faltó' })
  })
})
