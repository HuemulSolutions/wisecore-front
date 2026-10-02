import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ViewModeToggle } from './assets-view-mode-toggle'

function setup(props: Partial<React.ComponentProps<typeof ViewModeToggle>> = {}) {
  const onSwitchToReader = vi.fn()
  const onSwitchToEditor = vi.fn()
  render(
    <ViewModeToggle
      isViewMode
      onSwitchToReader={onSwitchToReader}
      onSwitchToEditor={onSwitchToEditor}
      {...props}
    />,
  )
  return { onSwitchToReader, onSwitchToEditor }
}

describe('ViewModeToggle', () => {
  it('marca el modo activo y cambia a Editor con click', async () => {
    const { onSwitchToEditor } = setup()

    expect(screen.getByRole('radio', { name: 'Reader' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: 'Editor' }))
    expect(onSwitchToEditor).toHaveBeenCalledTimes(1)
  })

  it('no deselecciona al volver a pulsar el modo activo', async () => {
    const { onSwitchToReader, onSwitchToEditor } = setup()

    await userEvent.click(screen.getByRole('radio', { name: 'Reader' }))
    expect(onSwitchToReader).not.toHaveBeenCalled()
    expect(onSwitchToEditor).not.toHaveBeenCalled()
  })

  it('se opera con teclado (Tab + flecha + Enter)', async () => {
    const { onSwitchToEditor } = setup()

    await userEvent.tab()
    expect(screen.getByRole('radio', { name: 'Reader' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(onSwitchToEditor).toHaveBeenCalledTimes(1)
  })

  it('en modo compacto oculta las etiquetas y conserva el nombre accesible', () => {
    setup({ compact: true })

    expect(screen.queryByText('Reader')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Reader' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Editor' })).toBeInTheDocument()
  })
})
