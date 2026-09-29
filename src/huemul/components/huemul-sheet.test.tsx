import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HuemulSheet } from './huemul-sheet'

const baseProps = {
  open: true,
  onOpenChange: () => {},
  title: 'Editar cosa',
  saveAction: { label: 'Guardar', onClick: vi.fn() },
}

const skeletons = () => document.querySelectorAll('[data-slot="skeleton"]')

describe('HuemulSheet bodyLoading', () => {
  it('abre con el skeleton por defecto en vez de los children', () => {
    render(<HuemulSheet {...baseProps} bodyLoading><p>Contenido real</p></HuemulSheet>)
    expect(screen.getByText('Editar cosa')).toBeInTheDocument()
    expect(skeletons().length).toBeGreaterThan(0)
    expect(screen.queryByText('Contenido real')).not.toBeInTheDocument()
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('deshabilita guardar pero deja Cancelar activo mientras carga', () => {
    render(<HuemulSheet {...baseProps} bodyLoading><p>Contenido real</p></HuemulSheet>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
  })

  it('usa bodySkeleton en lugar del skeleton por defecto', () => {
    render(
      <HuemulSheet {...baseProps} bodyLoading bodySkeleton={<div>Esqueleto propio</div>}>
        <p>Contenido real</p>
      </HuemulSheet>,
    )
    expect(screen.getByText('Esqueleto propio')).toBeInTheDocument()
    expect(skeletons()).toHaveLength(0)
  })

  it('sin bodyLoading muestra los children y guardar habilitado', () => {
    render(<HuemulSheet {...baseProps}><p>Contenido real</p></HuemulSheet>)
    expect(screen.getByText('Contenido real')).toBeInTheDocument()
    expect(skeletons()).toHaveLength(0)
    expect(document.querySelector('[aria-busy="true"]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
  })
})
