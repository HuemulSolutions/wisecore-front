/**
 * Pestaña de embeddings · 3 espacios: el predeterminado (el que usa la búsqueda) y hasta dos de
 * evaluación. Reemplaza al test de un solo proveedor (embeddings-tab.reindex.test.tsx).
 */
import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EmbeddingsTab } from '@/components/embedding-provider/embeddings-tab'
import { renderWithProviders } from '@/test/render'
import type { EmbeddingProviderSlot, EmbeddingsTabProps } from '@/types/embedding-provider'

const current: EmbeddingProviderSlot = {
  id: 'p-default',
  name: 'openai',
  display_name: 'OpenAI',
  label: 'Large 3',
  model_name: 'text-embedding-3-large',
  dimensions: 3072,
  is_default: true,
  index_status: 'ready',
  chunks_total: 200,
  chunks_with_vectors: 200,
  coverage_ratio: 1,
  max_providers: 3,
}
const candidate: EmbeddingProviderSlot = {
  ...current,
  id: 'p-candidate',
  label: 'Small 3',
  model_name: 'text-embedding-3-small',
  dimensions: 1536,
  is_default: false,
}

function renderTab(overrides: Partial<EmbeddingsTabProps> = {}) {
  const props: EmbeddingsTabProps = {
    providers: [current],
    maxProviders: 3,
    options: [
      { name: 'openai', display: 'OpenAI', isActive: true, requiresEndpoint: false, requiresDeployment: false },
      { name: 'azure_openai', display: 'Azure OpenAI', isActive: false, requiresEndpoint: true, requiresDeployment: true },
    ],
    testStates: {},
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    onConfigureFirst: vi.fn(),
    onAddProvider: vi.fn(),
    onEditProvider: vi.fn(),
    onTestProvider: vi.fn(),
    onMakeDefault: vi.fn(async () => {}),
    onBuildIndex: vi.fn(),
    onDeleteProvider: vi.fn(async () => {}),
    ...overrides,
  }
  return { ...renderWithProviders(<EmbeddingsTab {...props} />), props }
}

describe('EmbeddingsTab · espacios', () => {
  it('muestra el predeterminado y los espacios libres hasta el tope', () => {
    renderTab()
    expect(screen.getByText('Providers (1 of 3 slots)')).toBeInTheDocument()
    const card = screen.getByRole('article', { name: 'Large 3' })
    expect(within(card).getByText('Default · in use')).toBeInTheDocument()
    expect(within(card).getByText('200 of 200 fragments with vectors (100%)')).toBeInTheDocument()
    expect(screen.getAllByText('Free slot')).toHaveLength(2)
  })

  it('explica para qué sirven los espacios, cómo se usan y qué implican', async () => {
    const { user } = renderTab({ providers: [current, candidate] })
    const toggle = screen.getByRole('button', { name: 'How do the 3 slots work?' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(screen.getByText("What they're for")).toBeInTheDocument()
    expect(screen.getByText('How to use them')).toBeInTheDocument()
    expect(screen.getByText(/indexing costs up to 3 times as much/)).toBeInTheDocument()
  })

  it('agrega un proveedor desde un espacio libre', async () => {
    const { user, props } = renderTab()
    await user.click(screen.getAllByRole('button', { name: 'Add provider' })[0])
    expect(props.onAddProvider).toHaveBeenCalled()
  })

  it('no deja hacer predeterminado a un proveedor sin índice', () => {
    renderTab({ providers: [current, { ...candidate, index_status: 'building', coverage_ratio: 0.4 }] })
    const card = screen.getByRole('article', { name: 'Small 3' })
    expect(within(card).getByRole('button', { name: /Make default/ })).toBeDisabled()
  })

  it('confirma antes de promover y avisa si la cobertura está incompleta (force)', async () => {
    const partial = { ...candidate, chunks_with_vectors: 100, coverage_ratio: 0.5 }
    const { user, props } = renderTab({ providers: [current, partial] })
    const card = screen.getByRole('article', { name: 'Small 3' })
    await user.click(within(card).getByRole('button', { name: /Make default/ }))
    expect(await screen.findByText("It isn't complete yet")).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Promote anyway' }))
    expect(props.onMakeDefault).toHaveBeenCalledWith(partial, true)
  })

  it('promueve sin force cuando el proveedor está completo', async () => {
    const { user, props } = renderTab({ providers: [current, candidate] })
    const card = screen.getByRole('article', { name: 'Small 3' })
    await user.click(within(card).getByRole('button', { name: /Make default/ }))
    await user.click(await screen.findByRole('button', { name: 'Make default' }))
    expect(props.onMakeDefault).toHaveBeenCalledWith(candidate, false)
  })

  it('no deja borrar el predeterminado mientras haya otros proveedores', async () => {
    const { user, props } = renderTab({ providers: [current, candidate] })
    const defaultCard = screen.getByRole('article', { name: 'Large 3' })
    expect(within(defaultCard).getByRole('button', { name: 'Delete' })).toBeDisabled()

    const evaluationCard = screen.getByRole('article', { name: 'Small 3' })
    await user.click(within(evaluationCard).getByRole('button', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(props.onDeleteProvider).toHaveBeenCalledWith(candidate)
  })

  it('sin proveedores mantiene el flujo de configurar el primero', async () => {
    const { user, props } = renderTab({ providers: [] })
    expect(screen.getByText(/There's no provider configured yet/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Configure' })[1])
    expect(props.onConfigureFirst).toHaveBeenCalledWith('azure_openai')
  })
})
