import { QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import {
  DocumentDataProvider,
  useDataTableRefresh,
  useResolvedDataTable,
} from '@/contexts/document-data-context'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { makeTestQueryClient } from '@/test/render'
import type { DataTableElement } from '@/types/data-table-node'

const element: DataTableElement = {
  type: 'data_table',
  node_id: 'node-1',
  source: 'related_documents',
  scope: { kind: 'current' },
  columns: [{ id: 'related_document_name' }],
  children: [{ text: '' }],
}

function Probe() {
  const resolved = useResolvedDataTable(element)
  const { refresh, isFetching } = useDataTableRefresh()
  return (
    <div>
      <span data-testid="state">{resolved.state}</span>
      <span data-testid="refresh">{refresh ? 'available' : 'none'}</span>
      <span data-testid="fetching">{String(isFetching)}</span>
      <button type="button" onClick={() => void refresh?.()}>
        refresh
      </button>
    </div>
  )
}

function mockResolve() {
  const calls: unknown[] = []
  server.use(
    http.post(`${backendUrl}/documents/doc-1/data-tables/resolve`, async ({ request }) => {
      calls.push(await request.json())
      return respondOk({
        resolved_at: new Date().toISOString(),
        tables: [
          {
            node_id: 'node-1',
            status: 'ok',
            headers: ['Activo'],
            aligns: ['left'],
            rows: [['Infra']],
            total_rows: 1,
            truncated: false,
            omitted_columns: [],
            message: null,
          },
        ],
      })
    }),
  )
  return calls
}

describe('DocumentDataProvider — refresh', () => {
  it('refresh vuelve a llamar a /resolve aunque la query siga fresca', async () => {
    const calls = mockResolve()
    const queryClient = makeTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <DocumentDataProvider documentId="doc-1" organizationId="org-1">
          <Probe />
        </DocumentDataProvider>
      </QueryClientProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('ok'))
    expect(calls).toHaveLength(1)
    expect(screen.getByTestId('refresh')).toHaveTextContent('available')

    await act(async () => {
      screen.getByRole('button', { name: 'refresh' }).click()
    })

    await waitFor(() => expect(calls).toHaveLength(2))
  })

  it('sin documento refresh es null y no hay request', async () => {
    const calls = mockResolve()
    const queryClient = makeTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <DocumentDataProvider documentId={null} organizationId="org-1">
          <Probe />
        </DocumentDataProvider>
      </QueryClientProvider>,
    )

    expect(screen.getByTestId('refresh')).toHaveTextContent('none')
    await act(async () => {
      screen.getByRole('button', { name: 'refresh' }).click()
    })
    expect(calls).toHaveLength(0)
  })
})
