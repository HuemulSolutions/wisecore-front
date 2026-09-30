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
