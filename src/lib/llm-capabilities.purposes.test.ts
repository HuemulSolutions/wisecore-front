/**
 * LLM por propósito (PR backend #356): capabilities que exige cada uso. Tienen que coincidir
 * con `PURPOSE_REQUIRED_CAPABILITIES` del backend o la UI ofrecería opciones que dan 400.
 */
import { describe, expect, it } from 'vitest'

import {
  PURPOSE_REQUIRED_CAPABILITIES,
  isMarkedForPurpose,
  lockedCapabilities,
  missingPurposeCapabilities,
} from '@/lib/llm-capabilities'

describe('llm-capabilities · propósitos', () => {
  it('replica las capabilities que exige el backend', () => {
    expect(PURPOSE_REQUIRED_CAPABILITIES).toEqual({
      rerank: ['text_input', 'text_output'],
      image_analysis: ['image_input'],
    })
  })

  it('informa qué le falta a un modelo para cada uso', () => {
    const textOnly = { capabilities: ['text_input', 'text_output'] }
    expect(missingPurposeCapabilities(textOnly, 'rerank')).toEqual([])
    expect(missingPurposeCapabilities(textOnly, 'image_analysis')).toEqual(['image_input'])
    expect(missingPurposeCapabilities({ capabilities: [] }, 'rerank')).toEqual(['text_input', 'text_output'])
  })

  it('bloquea las capabilities de los usos marcados', () => {
    expect(isMarkedForPurpose({ is_rerank_default: true }, 'rerank')).toBe(true)
    expect(isMarkedForPurpose({ is_rerank_default: true }, 'image_analysis')).toBe(false)
    expect([...lockedCapabilities({ is_image_analysis_default: true })]).toEqual(['image_input'])
    expect(lockedCapabilities({}).size).toBe(0)
  })
})
