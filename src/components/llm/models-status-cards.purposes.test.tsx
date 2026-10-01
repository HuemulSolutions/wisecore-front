/**
 * Filas de estado · selector de modelo para rerank y análisis de imágenes.
 * Antes "Elegir modelo" solo cambiaba a la pestaña ya activa y no hacía nada.
 */
import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ModelsStatusCards } from '@/components/llm/models-status-cards'
import { renderWithProviders } from '@/test/render'
import type { LLM, ModelsStatusCardsProps } from '@/types/models'

const textModel: LLM = {
  id: 'llm-text',
  name: 'gpt-6-luna',
  internal_name: 'gpt-6-luna',
  provider_id: 'p1',
  capabilities: ['text_input', 'text_output'],
}
const visionModel: LLM = {
  id: 'llm-vision',
  name: 'gpt-5.4',
  internal_name: 'gpt-5.4',
  provider_id: 'p1',
  capabilities: ['text_input', 'text_output', 'image_input'],
}

function renderCards(overrides: Partial<ModelsStatusCardsProps> = {}) {
  const props: ModelsStatusCardsProps = {
    isLoading: false,
    defaultModel: null,
    defaultConfigured: true,
    defaultWorking: true,
    hasProviders: true,
    embeddingConfigured: true,
    embeddingWorking: true,
    rerankModel: null,
    imageAnalysisModel: null,
    canTest: false,
    canCreateProvider: true,
    canCreateModel: true,
    canViewEmbeddings: true,
    canChoosePurposeModel: true,
    models: [textModel, visionModel],
    isPurposePending: false,
    onTestDefault: () => {},
    onConnectProvider: () => {},
    onAddModel: vi.fn(),
    onGoToEmbeddings: () => {},
    onSetPurpose: vi.fn(),
    onClearPurpose: vi.fn(),
    ...overrides,
  }
  return { ...renderWithProviders(<ModelsStatusCards {...props} />), props }
}

describe('ModelsStatusCards · elegir modelo por propósito', () => {
  it('abre el selector y marca el modelo elegido para rerank', async () => {
    const { user, props } = renderCards()
    await user.click(screen.getAllByRole('button', { name: 'Choose model' })[0])
    await user.click(await screen.findByRole('option', { name: /gpt-6-luna/ }))
    expect(props.onSetPurpose).toHaveBeenCalledWith(textModel, 'rerank')
  })

  it('deshabilita los modelos sin la capability del propósito', async () => {
    const { user, props } = renderCards()
    await user.click(screen.getAllByRole('button', { name: 'Choose model' })[1])
    const textOption = await screen.findByRole('option', { name: /gpt-6-luna/ })
    expect(textOption).toBeDisabled()
    await user.click(screen.getByRole('option', { name: /gpt-5.4/ }))
    expect(props.onSetPurpose).toHaveBeenCalledWith(visionModel, 'image_analysis')
  })

  it('avisa cuando ningún modelo tiene las capacidades requeridas', async () => {
    const { user, props } = renderCards({ models: [textModel] })
    await user.click(screen.getAllByRole('button', { name: 'Choose model' })[1])
    expect(await screen.findByText(/No model has the required capabilities/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add model' }))
    expect(props.onAddModel).toHaveBeenCalled()
  })

  it('con modelo asignado ofrece cambiarlo o quitarlo', async () => {
    const assigned = { ...textModel, is_rerank_default: true }
    const { user, props } = renderCards({ rerankModel: assigned, models: [assigned, visionModel] })
    await user.click(screen.getByRole('button', { name: 'Change' }))
    await user.click(await screen.findByText('Stop using for Higher precision search'))
    expect(props.onClearPurpose).toHaveBeenCalledWith('rerank')
  })

  it('sin permiso no muestra el selector', () => {
    renderCards({ canChoosePurposeModel: false })
    expect(screen.queryByRole('button', { name: 'Choose model' })).not.toBeInTheDocument()
  })
})
