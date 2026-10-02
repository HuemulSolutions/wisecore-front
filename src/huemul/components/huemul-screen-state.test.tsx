import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HuemulScreenState } from './huemul-screen-state'
import type { ScreenStateConfig } from '@/types/huemul'

const base: ScreenStateConfig = {
  title: 'Screen title',
  text: 'Screen description',
  cardTitle: 'Card title',
  cardSub: 'Card subtitle',
}

describe('HuemulScreenState', () => {
  it('muestra título, descripción y cabecera de la tarjeta', () => {
    render(<HuemulScreenState config={base} />)

    expect(screen.getByRole('heading', { name: 'Screen title' })).toBeInTheDocument()
    expect(screen.getByText('Screen description')).toBeInTheDocument()
    expect(screen.getByText('Card title')).toBeInTheDocument()
    expect(screen.getByText('Card subtitle')).toBeInTheDocument()
  })

  it('pasos: solo el paso activo muestra su botón primario y lo dispara', async () => {
    const onClick = vi.fn()
    const onInactive = vi.fn()
    render(
      <HuemulScreenState
        config={{
          ...base,
          steps: [
            { n: '1', title: 'First', text: 'one', active: true, action: { label: 'Do it', onClick } },
            { n: '2', title: 'Second', text: 'two', action: { label: 'Never', onClick: onInactive } },
          ],
        }}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Never' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Do it' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('ítems: muestra nombre, tipo y estado con su color semántico', () => {
    render(
      <HuemulScreenState
        config={{
          ...base,
          items: [
            { n: '1', name: 'Intro', type: 'Text', status: 'Ready', tone: 'ok' },
            { n: '2', name: 'Scope', type: 'AI', status: 'Failed', tone: 'error' },
            { n: '3', name: 'Risks', type: 'AI', status: 'Missing', tone: 'warn' },
          ],
        }}
      />,
    )

    expect(screen.getByText('Ready')).toHaveClass('text-[#15803d]')
    expect(screen.getByText('Failed')).toHaveClass('text-[#b91c1c]')
    expect(screen.getByText('Missing')).toHaveClass('text-[#b45309]')
  })

  it('itemsAction sin ítems igualmente se muestra', () => {
    render(<HuemulScreenState config={{ ...base, itemsAction: { label: 'Retry all', onClick: vi.fn() } }} />)
    expect(screen.getByRole('button', { name: 'Retry all' })).toBeInTheDocument()
  })

  it('bloque mini y pie con acciones secundarias', async () => {
    const onClick = vi.fn()
    render(
      <HuemulScreenState
        config={{
          ...base,
          mini: { title: 'Mini title', items: [{ t: 'A', d: 'a desc' }, { t: 'B', d: 'b desc' }] },
          foot: 'Footer text',
          actions: [{ label: 'Back', onClick }],
        }}
      />,
    )

    expect(screen.getByText('Mini title')).toBeInTheDocument()
    expect(screen.getByText('a desc')).toBeInTheDocument()
    expect(screen.getByText('Footer text')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('una acción asíncrona queda en loading y no se dispara dos veces', async () => {
    let resolve: () => void = () => undefined
    const onClick = vi.fn(() => new Promise<void>((r) => { resolve = r }))
    render(<HuemulScreenState config={{ ...base, actions: [{ label: 'Retry', onClick }] }} />)

    const button = screen.getByRole('button', { name: 'Retry' })
    await userEvent.click(button)
    expect(button).toBeDisabled()
    await userEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    resolve()
    await waitFor(() => expect(button).toBeEnabled())
  })

  it('loading controlado deshabilita la acción', () => {
    render(<HuemulScreenState config={{ ...base, actions: [{ label: 'Retry', onClick: vi.fn(), loading: true }] }} />)
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDisabled()
  })
})
