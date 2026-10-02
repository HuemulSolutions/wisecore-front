import { http, delay } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { ORG_A_ID, activeUser } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'
import { respondOk } from '@/test/msw/respond'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/render'

import { SectionDefinitionSheet } from './section-definition-sheet'

const DOC_ID = 'doc-1'
const SECTION_ID = 'section-1'

const sectionsConfig = {
  document: { id: DOC_ID, name: 'Contrato', template_id: null },
  sections: [
    { id: SECTION_ID, name: 'Alcance del proyecto', type: 'manual', prompt: '', order: 1, dependencies: [], manual_input: 'Texto fijo' },
  ],
}

function renderSheet(open: boolean) {
  return renderWithProviders(
    <SectionDefinitionSheet open={open} onOpenChange={() => {}} documentId={DOC_ID} sectionId={SECTION_ID} />,
    {
      session: { token: makeLoginToken(), user: activeUser },
      org: { id: ORG_A_ID, token: makeOrgToken({ org_id: ORG_A_ID }) },
    },
  )
}

describe('SectionDefinitionSheet', () => {
  it('cerrado no pide la configuración de secciones ni renderiza nada', () => {
    const onRequest = vi.fn()
    server.use(
      http.get(`${backendUrl}/documents/${DOC_ID}/sections_config`, () => {
        onRequest()
        return respondOk(sectionsConfig)
      }),
    )
    const { container } = renderSheet(false)
    expect(container).toBeEmptyDOMElement()
    expect(onRequest).not.toHaveBeenCalled()
  })

  it('abierto carga la definición y muestra el sheet de configuración de la sección', async () => {
    server.use(http.get(`${backendUrl}/documents/${DOC_ID}/sections_config`, () => respondOk(sectionsConfig)))
    renderSheet(true)
    expect(await screen.findByText('Configure section')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Alcance del proyecto')).toBeInTheDocument()
  })

  it('abre al instante con skeleton: el sheet aparece antes de que llegue la definición', async () => {
    server.use(
      http.get(`${backendUrl}/documents/${DOC_ID}/sections_config`, async () => {
        await delay(400)
        return respondOk(sectionsConfig)
      }),
    )
    renderSheet(true)
    expect(await screen.findByText('Configure section')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Alcance del proyecto')).not.toBeInTheDocument()
    expect(await screen.findByDisplayValue('Alcance del proyecto')).toBeInTheDocument()
  })
})
