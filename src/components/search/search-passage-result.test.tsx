/**
 * Tarjeta de pasaje: cita, enlace a la sección y feedback.
 */
import { http } from 'msw'
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { backendUrl } from '@/config'
import { SearchPassageResult } from '@/components/search/search-passage-result'
import { passageAssetPath } from '@/lib/search-passages'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import type { SearchPassage } from '@/types/search'

const passage: SearchPassage = {
  passage_id: 'p-1',
  rank: 1,
  score: 0.87,
  source_kind: 'section_output',
  text: 'Los trabajadores tienen derecho a 15 días hábiles de vacaciones.',
  snippet: 'Los trabajadores tienen derecho a **15 días hábiles** de vacaciones.',
  context: null,
  citation: {
    document_id: 'doc-1',
    document_name: 'Reglamento interno',
    internal_code: 'RI-001',
    document_type_id: 't1',
    document_type_name: 'Política',
    execution_id: 'ex-1',
    execution_name: 'Versión 3',
    version_string: '1.2.0',
    lifecycle_state: 'published',
    section_execution_id: 'se-1',
    section_id: 'sec-1',
    section_name: 'Feriado anual',
    heading_path: ['Capítulo 4', 'Feriado anual'],
    url: 'https://front/org/asset/doc-1?execution=ex-1',
  },
  media: [],
  related_assets: [],
}

describe('SearchPassageResult', () => {
  it('muestra la cita y el fragmento', () => {
    renderWithProviders(
      <SearchPassageResult passage={passage} organizationId="org-1" searchLogId="log-1" canSendFeedback canDownloadMedia={false} />,
    )
    expect(screen.getByText('Reglamento interno')).toBeInTheDocument()
    expect(screen.getByText('RI-001')).toBeInTheDocument()
    expect(screen.getByText('v1.2.0')).toBeInTheDocument()
    expect(screen.getByText('Capítulo 4 › Feriado anual')).toBeInTheDocument()
    expect(screen.getByText('87% match')).toBeInTheDocument()
    expect(screen.getByText('15 días hábiles')).toBeInTheDocument()
  })

  it('enlaza a la versión y a la sección, no a la url absoluta', () => {
    expect(passageAssetPath(passage)).toBe('/asset/doc-1?execution=ex-1&section=sec-1')
    expect(
      passageAssetPath({ ...passage, citation: { ...passage.citation, section_id: null, section_execution_id: null } }),
    ).toBe('/asset/doc-1?execution=ex-1')
  })

  it('el pulgar abajo pide un comentario y lo envía', async () => {
    const sent = vi.fn()
    server.use(
      http.post(`${backendUrl}/search/feedback`, async ({ request }) => {
        sent(await request.json())
        return respondOk({ id: 'fb-1' })
      }),
    )
    const { user } = renderWithProviders(
      <SearchPassageResult passage={passage} organizationId="org-1" searchLogId="log-1" canSendFeedback canDownloadMedia={false} />,
    )
    await user.click(screen.getByRole('button', { name: 'Not useful' }))
    await user.type(screen.getByPlaceholderText('What were you looking for? (optional)'), 'buscaba el plazo')
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText('Thanks for the feedback')).toBeInTheDocument()
    expect(sent).toHaveBeenCalledWith({ search_log_id: 'log-1', passage_id: 'p-1', useful: false, comment: 'buscaba el plazo' })
  })

  it('sin registro de la búsqueda o sin permiso no ofrece feedback', () => {
    const { rerender } = renderWithProviders(
      <SearchPassageResult passage={passage} organizationId="org-1" searchLogId={null} canSendFeedback canDownloadMedia={false} />,
    )
    expect(screen.queryByRole('button', { name: 'Useful' })).not.toBeInTheDocument()
    rerender(
      <SearchPassageResult passage={passage} organizationId="org-1" searchLogId="log-1" canSendFeedback={false} canDownloadMedia={false} />,
    )
    expect(screen.queryByRole('button', { name: 'Useful' })).not.toBeInTheDocument()
  })
})
