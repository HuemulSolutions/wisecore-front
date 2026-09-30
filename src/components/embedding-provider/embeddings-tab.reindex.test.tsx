/**
 * Pestaña de embeddings · aviso de reindexación (PR backend #356).
 */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EmbeddingsTab } from '@/components/embedding-provider/embeddings-tab'
import { renderWithProviders } from '@/test/render'
import type { EmbeddingProvider, EmbeddingsTabProps } from '@/types/embedding-provider'

function renderTab(configured: EmbeddingProvider) {
  const props: EmbeddingsTabProps = {
    configured,
    options: [{ name: 'openai', display: 'OpenAI', isActive: true, requiresEndpoint: false, requiresDeployment: false }],
    testState: 'idle',
    canCreate: true,
    canUpdate: true,
    canDelete: true,
    onTest: () => {},
    onEditCredentials: () => {},
    onChooseProvider: () => {},
    onDisconnect: async () => {},
  }
  return renderWithProviders(<EmbeddingsTab {...props} />)
}

describe('EmbeddingsTab · índice', () => {
  it('avisa mientras la búsqueda se reconstruye', () => {
    renderTab({ name: 'openai', index_status: 'building' })
    expect(screen.getByText(/Search is being rebuilt with this provider/)).toBeInTheDocument()
  })

  it('avisa si la reconstrucción falló', () => {
    renderTab({ name: 'openai', index_status: 'failed' })
    expect(screen.getByText(/Search couldn't be rebuilt with this provider/)).toBeInTheDocument()
  })

  it('no avisa con el índice listo', () => {
    renderTab({ name: 'openai', index_status: 'ready' })
    expect(screen.queryByText(/being rebuilt|couldn't be rebuilt/)).not.toBeInTheDocument()
  })
})
