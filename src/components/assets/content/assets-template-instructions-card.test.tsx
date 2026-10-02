import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AssetsTemplateInstructionsCard } from './assets-template-instructions-card'
import { renderWithProviders } from '@/test/render'

const TEXT = 'Primer párrafo.\nSegundo párrafo.'

describe('AssetsTemplateInstructionsCard', () => {
  it('arranca colapsada mostrando título y nombre de plantilla', () => {
    renderWithProviders(<AssetsTemplateInstructionsCard instructions={TEXT} templateName="Solicitud CAPEX" />)
    expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument()
    expect(screen.getByText('Solicitud CAPEX')).toBeInTheDocument()
    expect(screen.queryByText('Primer párrafo.')).not.toBeInTheDocument()
  })

  it('expande y colapsa al hacer click en el header', async () => {
    const { user } = renderWithProviders(
      <AssetsTemplateInstructionsCard instructions={TEXT} templateName="Solicitud CAPEX" />,
    )
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument()
    expect(screen.getByText('Primer párrafo.')).toBeInTheDocument()
    expect(screen.getByText('Segundo párrafo.')).toBeInTheDocument()

    await user.click(screen.getByRole('button'))
    expect(screen.queryByText('Primer párrafo.')).not.toBeInTheDocument()
  })

  it('sin templateName no renderiza el nombre', () => {
    renderWithProviders(<AssetsTemplateInstructionsCard instructions={TEXT} templateName={null} />)
    expect(screen.queryByText('Solicitud CAPEX')).not.toBeInTheDocument()
  })
})
