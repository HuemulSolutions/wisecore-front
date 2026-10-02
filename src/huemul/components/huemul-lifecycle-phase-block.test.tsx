import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { HuemulLifecyclePhaseBlock } from './huemul-lifecycle-phase-block'
import type { LifecycleActionsController } from '@/types/lifecycle'

function makeController(overrides: Record<string, unknown> = {}): LifecycleActionsController {
  const pending = { isPending: false }
  return {
    status: {
      state: 'draft',
      stage: 'edit',
      current_group: 'Redacción',
      can_advance: true,
      can_rollback: false,
    },
    permissions: { edit: true },
    canTransition: true,
    finalLifecycleStage: 'publish',
    isBlockedByRequiredAnswers: false,
    advanceBlockers: [],
    completeLabel: 'Complete',
    checkMutation: pending,
    advanceMutation: pending,
    setIsCheckDialogOpen: vi.fn(),
    setIsPublishDialogOpen: vi.fn(),
    ...overrides,
  } as unknown as LifecycleActionsController
}

describe('HuemulLifecyclePhaseBlock', () => {
  it('muestra grupo y fase, y el botón principal habilitado sin title', async () => {
    const controller = makeController()
    render(<HuemulLifecyclePhaseBlock controller={controller} />)

    expect(screen.getByText('Elaboration')).toBeInTheDocument()
    expect(screen.getByText('Redacción')).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Complete' })
    expect(button).toBeEnabled()
    expect(button).not.toHaveAttribute('title')

    await userEvent.click(button)
    expect(controller.setIsCheckDialogOpen).toHaveBeenCalledWith(true)
  })

  it('bloqueado por respuestas obligatorias: deshabilitado y con title que lista los bloqueadores', () => {
    const controller = makeController({
      status: { state: 'draft', stage: 'edit', current_group: 'Redacción', can_advance: false, can_rollback: false },
      isBlockedByRequiredAnswers: true,
      advanceBlockers: [{ code: 'REQUIRED_ANSWERS_PENDING', section_execution_id: 's1', section_name: 'Alcance', missing_required: 2 }],
    })
    render(<HuemulLifecyclePhaseBlock controller={controller} />)

    expect(screen.getByRole('button', { name: 'Complete' })).toBeDisabled()
    const wrapper = screen.getByTitle(/It can't be completed yet/)
    expect(wrapper.getAttribute('title')).toContain('Alcance')
  })

  it('no pinta el botón principal sin permiso de transición', () => {
    render(<HuemulLifecyclePhaseBlock controller={makeController({ canTransition: false })} />)

    expect(screen.getByText('Elaboration')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('con elaboración externa en curso deshabilita el botón y explica el motivo', () => {
    const controller = makeController({
      status: {
        state: 'draft',
        stage: 'edit',
        current_group: 'Redacción',
        can_advance: true,
        can_rollback: false,
        is_locked_external_elaboration: true,
      },
    })
    render(<HuemulLifecyclePhaseBlock controller={controller} />)

    expect(screen.getByRole('button', { name: 'Complete' })).toBeDisabled()
    expect(document.querySelector('span[title]')).not.toBeNull()
  })
})
