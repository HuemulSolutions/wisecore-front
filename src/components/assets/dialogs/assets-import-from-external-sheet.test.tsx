import { http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { ORG_A_ID, activeUser } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import { respondApiError, respondOk } from '@/test/msw/respond'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

import { ImportAssetFromExternalSheet } from './assets-import-from-external-sheet'

const SYSTEM = { id: 'sys-1', name: 'CRM', status: 'active' }

function functionality(executionType: 'sync' | 'async') {
  return {
    id: 'fn-1',
    name: 'Importar ficha',
    external_system_id: SYSTEM.id,
    objective: 'import_asset',
    execution_type: executionType,
    http_method: 'POST',
    functionality_class: 'endpoint',
    partial_url: '/import',
    // Sin placeholders {{input:...}}: el sheet queda en modo genérico y se puede enviar.
    body: '{}',
    description: null,
  }
}

function run(status: string, extra: Record<string, unknown> = {}) {
  return {
    import_run_id: 'run-1',
    status,
    external_functionality_id: 'fn-1',
    folder_id: null,
    document_id: null,
    document_name: null,
    error_detail: null,
    callback_expires_at: '2026-10-02T20:00:00Z',
    created_at: '2026-10-02T18:00:00',
    finished_at: null,
    ...extra,
  }
}

function useCatalog(executionType: 'sync' | 'async') {
  server.use(
    http.get(`${backendUrl}/external-systems/`, () => respondOk([SYSTEM])),
    http.get(`${backendUrl}/external-systems/${SYSTEM.id}/functionalities/`, () =>
      respondOk([functionality(executionType)]),
    ),
  )
}

function renderSheet(props: { onAssetCreated?: (asset: { id: string; name: string; type: string }) => void; onOpenChange?: (open: boolean) => void } = {}) {
  return renderWithProviders(
    <ImportAssetFromExternalSheet
      open
      onOpenChange={props.onOpenChange ?? (() => {})}
      onAssetCreated={props.onAssetCreated}
    />,
    {
      session: { token: makeLoginToken(), user: activeUser },
      org: { id: ORG_A_ID, token: makeOrgToken({ org_id: ORG_A_ID, is_org_admin: true }) },
    },
  )
}

async function chooseFunctionalityAndSubmit(user: ReturnType<typeof renderSheet>['user']) {
  await user.click(await screen.findByRole('combobox'))
  await user.click(await screen.findByRole('option', { name: SYSTEM.name }))
  await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(2))
  await user.click(screen.getAllByRole('combobox')[1])
  await user.click(await screen.findByRole('option', { name: 'Importar ficha' }))
  await user.click(screen.getByRole('button', { name: 'Generate Asset' }))
}

beforeEach(() => {
  vi.spyOn(toast, 'success').mockImplementation(() => 1)
  vi.spyOn(toast, 'info').mockImplementation(() => 1)
  vi.spyOn(toast, 'error').mockImplementation(() => 1)
})

describe('ImportAssetFromExternalSheet', () => {
  it('sync: abre el activo creado como siempre', async () => {
    useCatalog('sync')
    server.use(http.post(`${backendUrl}/external-asset-import/`, () => respondOk({ id: 'doc-1', name: 'Ficha' })))
    const onAssetCreated = vi.fn()
    const { user } = renderSheet({ onAssetCreated })

    await chooseFunctionalityAndSubmit(user)

    await waitFor(() =>
      expect(onAssetCreated).toHaveBeenCalledWith({ id: 'doc-1', name: 'Ficha', type: 'document' }),
    )
    expect(toast.success).toHaveBeenCalledWith('Asset "Ficha" created from extension')
  })

  it('async: avisa que es asíncrona, espera a la extensión y abre el activo al completarse', async () => {
    useCatalog('async')
    let polls = 0
    server.use(
      http.post(`${backendUrl}/external-asset-import/`, () => respondOk(run('awaiting_callback'), {}, 202)),
      http.get(`${backendUrl}/external-asset-import/runs/run-1`, () => {
        polls += 1
        return respondOk(
          polls === 1
            ? run('awaiting_callback')
            : run('completed', { document_id: 'doc-7', document_name: 'Ficha async' }),
        )
      }),
    )
    const onAssetCreated = vi.fn()
    const { user } = renderSheet({ onAssetCreated })

    await user.click(await screen.findByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: SYSTEM.name }))
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(2))
    await user.click(screen.getAllByRole('combobox')[1])
    await user.click(await screen.findByRole('option', { name: 'Importar ficha' }))
    expect(await screen.findByText(/This extension works asynchronously/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Generate Asset' }))
    expect(await screen.findByTestId('external-import-waiting')).toBeInTheDocument()
    expect(onAssetCreated).not.toHaveBeenCalled()

    // El segundo poll (a los 3 s) trae el run completado.
    await waitFor(
      () => expect(onAssetCreated).toHaveBeenCalledWith({ id: 'doc-7', name: 'Ficha async', type: 'document' }),
      { timeout: 8_000 },
    )
    expect(toast.success).toHaveBeenCalledWith('Asset "Ficha async" created from extension')
    expect(polls).toBe(2)
  })

  it('async: si el callback llegó antes del 202, abre el activo sin consultar', async () => {
    useCatalog('async')
    const runRequests = vi.fn()
    server.use(
      http.post(`${backendUrl}/external-asset-import/`, () =>
        respondOk(run('completed', { document_id: 'doc-8', document_name: 'Rápido' }), {}, 202),
      ),
      http.get(`${backendUrl}/external-asset-import/runs/run-1`, () => {
        runRequests()
        return respondOk(run('completed'))
      }),
    )
    const onAssetCreated = vi.fn()
    const { user } = renderSheet({ onAssetCreated })

    await chooseFunctionalityAndSubmit(user)

    await waitFor(() =>
      expect(onAssetCreated).toHaveBeenCalledWith({ id: 'doc-8', name: 'Rápido', type: 'document' }),
    )
    expect(runRequests).not.toHaveBeenCalled()
  })

  it('async: una importación fallida muestra el motivo y no abre nada', async () => {
    useCatalog('async')
    server.use(
      http.post(`${backendUrl}/external-asset-import/`, () => respondOk(run('awaiting_callback'), {}, 202)),
      http.get(`${backendUrl}/external-asset-import/runs/run-1`, () =>
        respondOk(run('failed', { error_detail: 'Source file is empty' })),
      ),
    )
    const onAssetCreated = vi.fn()
    const { user } = renderSheet({ onAssetCreated })

    await chooseFunctionalityAndSubmit(user)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('The extension could not create the asset.', {
        description: 'Source file is empty',
        duration: 10_000,
      }),
    )
    expect(onAssetCreated).not.toHaveBeenCalled()
    expect(screen.queryByTestId('external-import-waiting')).not.toBeInTheDocument()
  })

  it('async: si falla la consulta del estado muestra el error con reintentar y no sigue consultando', async () => {
    useCatalog('async')
    let polls = 0
    server.use(
      http.post(`${backendUrl}/external-asset-import/`, () => respondOk(run('awaiting_callback'), {}, 202)),
      http.get(`${backendUrl}/external-asset-import/runs/run-1`, () => {
        polls += 1
        return respondApiError(500, 'INTERNAL_ERROR', 'boom')
      }),
    )
    const { user } = renderSheet()

    await chooseFunctionalityAndSubmit(user)

    expect(await screen.findByText('Could not check the status of the import. It may still be running.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 3_500))
    expect(polls).toBe(1)
  })

  it('async: cerrar mientras espera avisa que sigue en segundo plano', async () => {
    useCatalog('async')
    server.use(
      http.post(`${backendUrl}/external-asset-import/`, () => respondOk(run('awaiting_callback'), {}, 202)),
      http.get(`${backendUrl}/external-asset-import/runs/run-1`, () => respondOk(run('awaiting_callback'))),
    )
    const onOpenChange = vi.fn()
    const { user } = renderSheet({ onOpenChange })

    await chooseFunctionalityAndSubmit(user)
    expect(await screen.findByTestId('external-import-waiting')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(toast.info).toHaveBeenCalledWith(
      'The import continues in the background. The asset will appear in the library when the extension finishes.',
    )
  })
})
