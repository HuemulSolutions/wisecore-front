import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { respondOk } from '@/test/msw/respond'
import { server } from '@/test/msw/server'

import { getExternalAssetImportRun, importAssetFromExternal } from './external-asset-import'

const ORG = 'org-1'
const RUN = {
  import_run_id: 'run-1',
  status: 'awaiting_callback',
  external_functionality_id: 'fn-1',
  folder_id: null,
  document_id: null,
  document_name: null,
  error_detail: null,
  callback_expires_at: '2026-10-02T20:00:00Z',
  created_at: '2026-10-02T18:00:00',
  finished_at: null,
}

describe('importAssetFromExternal', () => {
  it('con una funcionalidad sync devuelve el activo creado (200)', async () => {
    server.use(
      http.post(`${backendUrl}/external-asset-import/`, () => respondOk({ id: 'doc-1', name: 'Importado' })),
    )
    const result = await importAssetFromExternal(ORG, { external_functionality_id: 'fn-1', input: {} })
    expect(result).toEqual({ kind: 'created', asset: { id: 'doc-1', name: 'Importado' } })
  })

  it('con una funcionalidad async devuelve el run (202)', async () => {
    let orgHeader: string | null = null
    server.use(
      http.post(`${backendUrl}/external-asset-import/`, ({ request }) => {
        orgHeader = request.headers.get('X-Org-Id')
        return respondOk(RUN, {}, 202)
      }),
    )
    const result = await importAssetFromExternal(ORG, { external_functionality_id: 'fn-1', input: {} })
    expect(result).toEqual({ kind: 'async', run: RUN })
    expect(orgHeader).toBe(ORG)
  })
})

describe('getExternalAssetImportRun', () => {
  it('consulta el run con la organización', async () => {
    let orgHeader: string | null = null
    server.use(
      http.get(`${backendUrl}/external-asset-import/runs/run-1`, ({ request }) => {
        orgHeader = request.headers.get('X-Org-Id')
        return respondOk({ ...RUN, status: 'completed', document_id: 'doc-9', document_name: 'Listo' })
      }),
    )
    const run = await getExternalAssetImportRun(ORG, 'run-1')
    expect(run.status).toBe('completed')
    expect(run.document_name).toBe('Listo')
    expect(orgHeader).toBe(ORG)
  })
})
