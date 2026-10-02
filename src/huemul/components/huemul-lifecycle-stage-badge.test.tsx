import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HuemulLifecycleStageBadge } from '@/huemul/components/huemul-lifecycle-stage-badge'

const status = { stage: 'edit', current_group: 'Solicitud de Inversión con un nombre muy largo' }
const fullLabel = 'Elaboration · Solicitud de Inversión con un nombre muy largo'

describe('HuemulLifecycleStageBadge', () => {
  it('con wrap muestra el texto completo y permite el salto de línea', () => {
    render(<HuemulLifecycleStageBadge status={status} wrap />)
    const badge = screen.getByText(fullLabel)
    expect(badge).toHaveAttribute('title', fullLabel)
    expect(badge).toHaveClass('whitespace-normal')
    expect(badge).not.toHaveClass('items-center')
  })

  it('sin wrap conserva el layout de una línea del panel', () => {
    render(<HuemulLifecycleStageBadge status={status} />)
    const badge = screen.getByText(fullLabel)
    expect(badge).toHaveClass('items-center')
    expect(badge).not.toHaveClass('whitespace-normal')
  })

  it('sin grupo muestra solo la etapa', () => {
    render(<HuemulLifecycleStageBadge status={{ stage: 'approved', current_group: null }} />)
    expect(screen.getByText('Approved')).toBeInTheDocument()
  })
})
