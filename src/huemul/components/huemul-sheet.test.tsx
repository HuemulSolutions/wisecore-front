import { useEffect } from 'react'
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

  it('bloquea extraActions de header y footer mientras carga', () => {
    render(
      <HuemulSheet
        {...baseProps}
        bodyLoading
        extraActions={[
          { label: 'Accion header', onClick: vi.fn(), position: 'header' },
          { label: 'Accion footer', onClick: vi.fn() },
        ]}
      >
        <p>Contenido real</p>
      </HuemulSheet>,
    )
    expect(screen.getByRole('button', { name: 'Accion header' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Accion footer' })).toBeDisabled()
  })

  it('no bloquea headerExtra ni footerContent: son del consumidor', () => {
    render(
      <HuemulSheet
        {...baseProps}
        bodyLoading
        headerExtra={<button>Extra header</button>}
        footerContent={<button>Footer propio</button>}
      >
        <p>Contenido real</p>
      </HuemulSheet>,
    )
    expect(screen.getByRole('button', { name: 'Extra header' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Footer propio' })).toBeEnabled()
  })

  it('no monta los children mientras carga (un form no inicializa estado con datos a medias)', () => {
    const onMount = vi.fn()
    function Child() {
      useEffect(() => { onMount() }, [])
      return <p>Contenido real</p>
    }
    const { rerender } = render(<HuemulSheet {...baseProps} bodyLoading><Child /></HuemulSheet>)
    expect(onMount).not.toHaveBeenCalled()

    rerender(<HuemulSheet {...baseProps} bodyLoading={false}><Child /></HuemulSheet>)
    expect(onMount).toHaveBeenCalledTimes(1)
  })

  it('al pasar bodyLoading de true a false muestra los children y habilita guardar', () => {
    const { rerender } = render(<HuemulSheet {...baseProps} bodyLoading><p>Contenido real</p></HuemulSheet>)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()

    rerender(<HuemulSheet {...baseProps} bodyLoading={false}><p>Contenido real</p></HuemulSheet>)
    expect(screen.getByText('Contenido real')).toBeInTheDocument()
    expect(skeletons()).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled()
  })
})
