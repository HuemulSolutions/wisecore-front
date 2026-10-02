import { http, delay } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { ORG_A_ID, activeUser } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import { respondApiError, respondOk } from '@/test/msw/respond'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

import EditDocumentDialog from './assets-edit-dialog'

const DOC_ID = 'doc-1'

function renderDialog(onOpenChange: (open: boolean) => void = () => {}) {
  return renderWithProviders(
    <EditDocumentDialog
      open
      onOpenChange={onOpenChange}
      documentId={DOC_ID}
      currentName="Nombre del listado"
      onUpdated={() => {}}
    />,
    {
      session: { token: makeLoginToken(), user: activeUser },
      org: { id: ORG_A_ID, token: makeOrgToken({ org_id: ORG_A_ID }) },
    },
  )
}

describe('EditDocumentDialog', () => {
  it('abre al instante con skeleton, sin form ni guardar hasta cargar el detalle', async () => {
    server.use(
      http.get(`${backendUrl}/documents/${DOC_ID}`, async () => {
        await delay(300)
        return respondOk({
          id: DOC_ID,
          name: 'Activo real',
          description: 'Desc',
          internal_code: 'COD-1',
          context_required: true,
          document_type: { id: 'dt-1', name: 'Tipo', color: '#fff' },
          created_by_user: null,
        })
      }),
    )
    renderDialog()

    // Sheet abierto, cuerpo en skeleton, form sin montar y guardar bloqueado.
    const save = await screen.findByRole('button', { name: /update|save/i })
    expect(save).toBeDisabled()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
    expect(screen.queryByDisplayValue('Nombre del listado')).not.toBeInTheDocument()

    await waitFor(() => expect(screen.getByDisplayValue('Activo real')).toBeInTheDocument())
    expect(screen.getByDisplayValue('COD-1')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(0)
  })

  it('si falla la carga se cierra y no deja un form con datos por defecto', async () => {
    server.use(
      http.get(`${backendUrl}/documents/${DOC_ID}`, () => respondApiError(500, 'INTERNAL_ERROR', 'boom')),
    )
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(screen.queryByDisplayValue('Nombre del listado')).not.toBeInTheDocument()
  })
})
