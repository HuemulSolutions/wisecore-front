import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LifecycleReviewSheet } from './lifecycle-review-sheet'
import type { LifecycleActionsController } from '@/types/lifecycle'

vi.mock('@/components/layout/mdx-editor', () => ({ default: () => <div data-testid="mdx-editor" /> }))
vi.mock('@/huemul/components/huemul-version-picker', () => ({
  HuemulVersionPicker: () => <div data-testid="version-picker" />,
}))
vi.mock('@/huemul/components/huemul-lifecycle-progress-header', () => ({
  HuemulLifecycleProgressHeader: () => null,
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
    progress: { nextStep: null },
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
})
