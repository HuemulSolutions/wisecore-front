/**
 * Estado de análisis de un archivo para la búsqueda (PR backend #356).
 */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HuemulMediaAnalysisBadge } from '@/huemul/components/huemul-media-analysis-badge'
import { renderWithProviders } from '@/test/render'

describe('HuemulMediaAnalysisBadge', () => {
  it('avisa que una imagen no se analizó por falta de modelo', () => {
    renderWithProviders(<HuemulMediaAnalysisBadge status="not_analyzed" />)
    const badge = screen.getByText('Not analyzed')
    expect(badge).toHaveAttribute('title', expect.stringContaining('no model is configured for image analysis'))
  })

  it.each([
    ['pending', 'Analyzing'],
    ['failed', 'Analysis failed'],
    ['skipped', 'No text'],
  ] as const)('muestra %s', (status, label) => {
    renderWithProviders(<HuemulMediaAnalysisBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('no muestra nada si ya se puede buscar o si el archivo no se indexa', () => {
    const { container, rerender } = renderWithProviders(<HuemulMediaAnalysisBadge status="completed" />)
    expect(container).toBeEmptyDOMElement()
    rerender(<HuemulMediaAnalysisBadge status={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
