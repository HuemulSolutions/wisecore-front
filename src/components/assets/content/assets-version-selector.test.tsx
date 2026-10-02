import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { VersionSelectorDropdown } from './assets-version-selector'

const executions = [
  { id: 'e2', created_at: '2026-03-10T10:00:00Z', name: 'Borrador B', status: 'completed', lifecycle_state: 'draft', version: null },
  { id: 'e1', created_at: '2026-03-01T10:00:00Z', name: 'Aprobada A', status: 'completed', lifecycle_state: 'approved', version: '1.0.0' },
]

function setup(props: Partial<React.ComponentProps<typeof VersionSelectorDropdown>> = {}) {
  const handlers = {
    onCreateExecution: vi.fn(),
    onSelectExecution: vi.fn(),
    onOpenVersionManagement: vi.fn(),
    onRenameVersion: vi.fn(),
  }
  render(
    <VersionSelectorDropdown
      allExecutions={executions}
      selectedExecutionId="e2"
      lifecyclePermissions={{ create: true, edit: true }}
      isCreatingPending={false}
      hasExecutionInProcess={false}
      {...handlers}
      {...props}
    />,
  )
  return handlers
}

describe('VersionSelectorDropdown', () => {
  it('el botón "+" crea una versión y su title es "New Version"', async () => {
    const { onCreateExecution } = setup()

    const plus = screen.getByRole('button', { name: 'New Version' })
    await userEvent.click(plus)
    expect(onCreateExecution).toHaveBeenCalledTimes(1)
  })

  it('con una ejecución en curso el "+" queda deshabilitado con el motivo', () => {
    setup({ hasExecutionInProcess: true })

    const plus = screen.getByRole('button', { name: 'An execution is in progress' })
    expect(plus).toBeDisabled()
  })

  it('sin can_generate el "+" queda deshabilitado con el motivo del backend', () => {
    setup({ canGenerate: false, cannotGenerateReason: 'Falta contexto' })
    expect(screen.getByRole('button', { name: 'Falta contexto' })).toBeDisabled()
  })

  it('sin permiso de crear no hay botón "+"', () => {
    setup({ lifecyclePermissions: { create: false, edit: true } })

    expect(screen.queryByRole('button', { name: 'New Version' })).not.toBeInTheDocument()
  })

  it('el menú marca la versión seleccionada y ofrece Renombrar solo para un borrador', async () => {
    const { onRenameVersion } = setup()

    await userEvent.click(screen.getByTitle('Switch Version'))
    const items = screen.getAllByRole('menuitem')
    expect(items.some((el) => el.getAttribute('aria-current') === 'true')).toBe(true)

    await userEvent.click(screen.getByRole('menuitem', { name: 'Rename' }))
    expect(onRenameVersion).toHaveBeenCalledWith({ id: 'e2', name: 'Borrador B' })
  })

  it('no muestra el texto del estado de ciclo de vida, solo el punto de color', async () => {
    setup({
      selectedExecutionId: 'e3',
      allExecutions: [
        { id: 'e3', created_at: '2026-03-12T10:00:00Z', name: 'V3', status: 'completed', lifecycle_state: 'published' },
        { id: 'e2', created_at: '2026-03-10T10:00:00Z', name: 'V2', status: 'completed', lifecycle_state: 'in_review' },
        { id: 'e1', created_at: '2026-03-01T10:00:00Z', name: 'V1', status: 'completed' },
      ],
    })

    expect(screen.getByTitle('Switch Version')).not.toHaveTextContent('Published')
    await userEvent.click(screen.getByTitle('Switch Version'))
    const items = screen.getAllByRole('menuitem')
    expect(items[0]).not.toHaveTextContent('Published')
    expect(items[1]).not.toHaveTextContent('In Review')
    expect(items[2]).not.toHaveTextContent('Elaboration')
  })

  it('no ofrece Renombrar cuando la versión seleccionada está aprobada', async () => {
    setup({ selectedExecutionId: 'e1' })

    await userEvent.click(screen.getByTitle('Switch Version'))
    expect(screen.queryByRole('menuitem', { name: 'Rename' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Manage versions/ })).toBeInTheDocument()
  })
})
