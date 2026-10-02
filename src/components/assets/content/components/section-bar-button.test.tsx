import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Play } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { SectionBarButton, SectionBarDivider } from './section-bar-button'

describe('SectionBarButton', () => {
  it('icon-only: expone el tooltip como title y aria-label, sin texto visible', () => {
    render(<SectionBarButton tone="secondary" icon={Play} tooltip="Editar" />)
    const button = screen.getByRole('button', { name: 'Editar' })
    expect(button).toHaveAttribute('title', 'Editar')
    expect(button).toHaveTextContent('')
  })

  it('primaria: muestra el label junto al ícono y aplica el tono azul', () => {
    render(<SectionBarButton tone="primary" icon={Play} label="Ejecutar" tooltip="Abrir panel" />)
    const button = screen.getByRole('button', { name: 'Abrir panel' })
    expect(button).toHaveTextContent('Ejecutar')
    expect(button.className).toContain('text-[#1d4ed8]')
  })

  it('dispara onClick', async () => {
    const onClick = vi.fn()
    render(<SectionBarButton tone="tertiary" icon={Play} tooltip="Copiar" onClick={onClick} />)
    await userEvent.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('dispara onPrefetch al hacer hover y al enfocar', async () => {
    const onPrefetch = vi.fn()
    render(<SectionBarButton tone="secondary" icon={Play} tooltip="Definición" onPrefetch={onPrefetch} />)
    const button = screen.getByRole('button', { name: 'Definición' })
    await userEvent.hover(button)
    expect(onPrefetch).toHaveBeenCalledTimes(1)
    button.focus()
    expect(onPrefetch).toHaveBeenCalledTimes(2)
  })

  it('deshabilitado: no dispara onClick y el title vive en un span envolvente', async () => {
    const onClick = vi.fn()
    render(<SectionBarButton tone="primary" icon={Play} tooltip="En progreso" disabled onClick={onClick} />)
    const button = screen.getByRole('button', { name: 'En progreso' })
    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute('title')
    expect(button.parentElement).toHaveAttribute('title', 'En progreso')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('SectionBarDivider', () => {
  it('es decorativo (aria-hidden)', () => {
    const { container } = render(<SectionBarDivider />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
