import { describe, expect, it } from 'vitest'
import { ApiError } from '@/types/api-error'
import {
  AGENT_FACET_KEY_MAX_LENGTH,
  isConflictError,
  isValidAgentIdentifier,
  suggestAgentIdentifier,
} from '@/lib/agent-identifiers'

const apiError = (status: number) =>
  new ApiError({
    transaction_id: 'tx',
    status_code: status,
    timestamp: '2026-01-01T00:00:00Z',
    error: { code: 'CONFLICT', message: 'duplicated' },
  })

describe('isValidAgentIdentifier', () => {
  it.each(['arquitectura', 'arquitectura-de-software', 'node24', 'a-1-b'])('acepta %s', (value) => {
    expect(isValidAgentIdentifier(value)).toBe(true)
  })

  it.each(['', 'Arquitectura', 'arq_soft', '-arq', 'arq-', 'arq--soft', 'arq soft', 'diseño'])('rechaza "%s"', (value) => {
    expect(isValidAgentIdentifier(value)).toBe(false)
  })
})

describe('suggestAgentIdentifier', () => {
  it('pasa el nombre a kebab-case sin acentos', () => {
    expect(suggestAgentIdentifier('Arquitectura de Software')).toBe('arquitectura-de-software')
    expect(suggestAgentIdentifier('  Diseño   & Revisión (v2) ')).toBe('diseno-revision-v2')
  })

  it('el resultado siempre es un identificador válido o vacío', () => {
    expect(suggestAgentIdentifier('!!!')).toBe('')
    expect(isValidAgentIdentifier(suggestAgentIdentifier('Runtime / Node 24'))).toBe(true)
  })

  it('recorta al máximo sin dejar un guion al final', () => {
    const suggestion = suggestAgentIdentifier(`${'a'.repeat(AGENT_FACET_KEY_MAX_LENGTH - 1)} b`, AGENT_FACET_KEY_MAX_LENGTH)
    expect(suggestion.length).toBeLessThanOrEqual(AGENT_FACET_KEY_MAX_LENGTH)
    expect(isValidAgentIdentifier(suggestion)).toBe(true)
  })
})

describe('isConflictError', () => {
  it('solo es true para un ApiError 409', () => {
    expect(isConflictError(apiError(409))).toBe(true)
    expect(isConflictError(apiError(400))).toBe(false)
    expect(isConflictError(new Error('409'))).toBe(false)
  })
})
