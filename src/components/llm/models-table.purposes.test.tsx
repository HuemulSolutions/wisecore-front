/**
 * Tabla de modelos · menú "Usar para…" (LLM por propósito, PR backend #356).
 */
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ModelsTable } from '@/components/llm/models-table'
import { renderWithProviders } from '@/test/render'
import type { LLM, ModelsTableProps } from '@/types/models'

const textModel: LLM = {
  id: 'llm-text',
  name: 'gpt-6-luna',
  internal_name: 'gpt-6-luna',
  provider_id: 'p1',
  capabilities: ['text_input', 'text_output'],
  is_rerank_default: true,
}
const visionModel: LLM = {
  id: 'llm-vision',
  name: 'gpt-5.4',
  internal_name: 'gpt-5.4',
  provider_id: 'p1',
  capabilities: ['text_input', 'text_output', 'image_input'],
}

function renderTable(overrides: Partial<ModelsTableProps> = {}) {
  const props: ModelsTableProps = {
    models: [textModel, visionModel],
    isLoading: false,
    isFetching: false,
    error: null,
    hasProviders: true,
    search: '',
    onSearchChange: () => {},
    testStates: {},
    isDeleting: false,
    onTest: () => {},
    onEdit: () => {},
    onSetDefault: () => {},
    onSetPurpose: vi.fn(),
    onClearPurpose: vi.fn(),
    onDelete: async () => {},
    onReviewProvider: () => {},
    onAddModel: () => {},
    onConnectProvider: () => {},
    onRetry: () => {},
    canCreateModel: true,
    canUpdateModel: true,
    canDeleteModel: true,
    canTestModel: false,
    canCreateProvider: true,
    canUpdateProvider: true,
    pagination: { page: 1, pageSize: 10, onPageChange: () => {}, onPageSizeChange: () => {} },
    ...overrides,
  }
  return { ...renderWithProviders(<ModelsTable {...props} />), props }
}

describe('ModelsTable · usar para…', () => {
  it('muestra el chip del propósito marcado', () => {
    renderTable()
    expect(screen.getByText('Precise search')).toBeInTheDocument()
  })

  it('ofrece quitar el propósito marcado y deshabilita el que le falta la capability', async () => {
    const { user, props } = renderTable()
    await user.click(screen.getAllByRole('button', { name: 'Use for…' })[0])
    expect(await screen.findByText('Stop using for Higher precision search')).toBeInTheDocument()
    const imageOption = screen.getByRole('menuitem', { name: /Use for Image analysis/ })
    expect(imageOption).toHaveAttribute('data-disabled')
    expect(screen.getByText("This model can't be used for this: it needs Reads images.")).toBeInTheDocument()

    await user.click(screen.getByText('Stop using for Higher precision search'))
    expect(props.onClearPurpose).toHaveBeenCalledWith('rerank')
  })

  it('marca un modelo con la capability necesaria', async () => {
    const { user, props } = renderTable()
    await user.click(screen.getAllByRole('button', { name: 'Use for…' })[1])
    await user.click(await screen.findByRole('menuitem', { name: /Use for Image analysis/ }))
    expect(props.onSetPurpose).toHaveBeenCalledWith(visionModel, 'image_analysis')
  })

  it('sin permiso de edición no muestra el menú', () => {
    renderTable({ canUpdateModel: false })
    expect(screen.queryByRole('button', { name: 'Use for…' })).not.toBeInTheDocument()
  })
})
