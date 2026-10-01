import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LifecycleReviewSheet } from './lifecycle-review-sheet'
import type { LifecycleActionsController } from '@/types/lifecycle'

vi.mock('@/components/layout/mdx-editor', () => ({ default: () => <div data-testid="mdx-editor" /> }))
vi.mock('@/huemul/components/huemul-version-picker', () => ({
  HuemulVersionPicker: () => <div data-testid="version-picker" />,
}))

function makeController(overrides: Record<string, unknown> = {}): LifecycleActionsController {
  const idle = { isPending: false, mutate: vi.fn() }
  return {
    status: { state: 'in_approval', current_group: 'Approve' },
    isApprovalStep: true,
    changeSummary: '',
    changeSummaryStatus: null,
    changeSummaryError: null,
    canViewChanges: false,
    isSummaryLoading: false,
    handleViewChanges: vi.fn(),
    missingRequiredCustomFields: [],
    progress: { isAvailable: false, phases: [], currentPhase: null, nextStep: null },
    advanceBlockersError: [],
    hasExternalReview: false,
    checkMutation: idle,
    assignVersionMutation: { isPending: false },
    isCheckDialogOpen: true,
    setIsCheckDialogOpen: vi.fn(),
    canAssignVersionInline: false,
    confirmApprovalWithVersion: vi.fn(),
    completeConfirmLabel: 'Complete',
    ...overrides,
  } as unknown as LifecycleActionsController
}

describe('LifecycleReviewSheet', () => {
  it('sin canAssignVersionInline (tipo no-ISO) no muestra el selector de versión', () => {
    render(<LifecycleReviewSheet controller={makeController()} executionId="e1" organizationId="o1" />)

    expect(screen.queryByTestId('version-picker')).not.toBeInTheDocument()
  })

  it('con canAssignVersionInline muestra el selector de versión', () => {
    render(
      <LifecycleReviewSheet
        controller={makeController({ canAssignVersionInline: true })}
        executionId="e1"
        organizationId="o1"
      />,
    )

    expect(screen.getByTestId('version-picker')).toBeInTheDocument()
  })

  it('con advanceBlockersError muestra la caja inline y el botón pasa a "Reintentar"', () => {
    const onGoToSection = vi.fn()
    render(
      <LifecycleReviewSheet
        controller={makeController({
          advanceBlockersError: [
            { code: 'REQUIRED_ANSWERS_PENDING', section_execution_id: 's1', section_name: 'Sección A', missing_required: 2 },
          ],
        })}
        executionId="e1"
        organizationId="o1"
        onGoToSection={onGoToSection}
      />,
    )

    expect(screen.getByText('Sección A')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reintentar|Retry/ })).toBeInTheDocument()
  })

  it('con campos personalizados obligatorios faltantes deshabilita el botón principal', () => {
    render(
      <LifecycleReviewSheet
        controller={makeController({ isApprovalStep: false, missingRequiredCustomFields: ['Campo X'] })}
        executionId="e1"
        organizationId="o1"
      />,
    )

    expect(screen.getByText('Campo X')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Complete' })).toBeDisabled()
  })

  it('con progreso disponible renderiza stepper, pasos de la fase y próximo paso', () => {
    render(
      <LifecycleReviewSheet
        controller={makeController({
          isApprovalStep: false,
          progress: {
            isAvailable: true,
            phases: [
              { key: 'edit', label: 'Elaboración', state: 'current' },
              { key: 'review', label: 'Revisión', state: 'upcoming' },
            ],
            currentPhase: {
              stage: 'edit',
              label: 'Elaboración',
              completed: 0,
              total: 1,
              steps: [{ id: 'st1', name: 'Redacción', state: 'current', roleNames: ['Editor'] }],
            },
            nextStep: { name: 'Revisión legal', stage: 'review', roleNames: ['Legal'] },
          },
        })}
        executionId="e1"
        organizationId="o1"
      />,
    )

    expect(screen.getByText('Redacción')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('Revisión legal')).toBeInTheDocument()
    expect(screen.getAllByText(/Revisión|Review/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Elaboración|Elaboration/).length).toBeGreaterThan(1)
  })

  it('traduce el nombre de grupo por defecto del backend en el título', () => {
    render(<LifecycleReviewSheet controller={makeController()} executionId="e1" organizationId="o1" />)

    expect(screen.queryByText(/Approve$/)).not.toBeInTheDocument()
  })
})
