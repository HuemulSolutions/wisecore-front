import { http, delay } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { ORG_A_ID, activeUser } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import { respondApiError, respondOk } from '@/test/msw/respond'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

import { EditTemplateDialog } from './templates-edit-dialog'

const TEMPLATE_ID = 'tpl-1'

function renderDialog(onOpenChange: (open: boolean) => void = () => {}) {
  return renderWithProviders(
    <EditTemplateDialog
      open
      onOpenChange={onOpenChange}
      templateId={TEMPLATE_ID}
      templateName="Nombre del listado"
      organizationId={ORG_A_ID}
      onSuccess={() => {}}
    />,
    {
      session: { token: makeLoginToken(), user: activeUser },
      org: { id: ORG_A_ID, token: makeOrgToken({ org_id: ORG_A_ID }) },
    },
  )
}

describe('EditTemplateDialog', () => {
  it('abre al instante con skeleton y no permite guardar hasta cargar el detalle', async () => {
    server.use(
      http.get(`${backendUrl}/templates/${TEMPLATE_ID}`, async () => {
        await delay(300)
        return respondOk({ name: 'Plantilla real', description: 'Desc', instructions: '', context_required: true })
      }),
    )
    renderDialog()

    // Sheet ya abierto, cuerpo en skeleton y guardar bloqueado (no se puede pisar context_required).
    const save = await screen.findByRole('button', { name: /update template/i })
    expect(save).toBeDisabled()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)

    await waitFor(() => expect(screen.getByDisplayValue('Plantilla real')).toBeInTheDocument())
    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(0)
  })
  it('si falla la carga del detalle se cierra en vez de dejar un form con valores por defecto', async () => {
    server.use(
      http.get(`${backendUrl}/templates/${TEMPLATE_ID}`, () =>
        respondApiError(500, 'INTERNAL_ERROR', 'boom'),
      ),
    )
    const onOpenChange = vi.fn()
    renderDialog(onOpenChange)

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    // Nunca se mostró el form editable con `context_required: false` inventado.
    expect(screen.queryByDisplayValue('Nombre del listado')).not.toBeInTheDocument()
  })
})
