import { describe, expect, it } from 'vitest'

import { defaultStepNameStage } from './lifecycle-labels'

describe('defaultStepNameStage', () => {
  it('reconoce los nombres por defecto del backend sin importar mayúsculas ni espacios', () => {
    expect(defaultStepNameStage('Approve')).toBe('approve')
    expect(defaultStepNameStage(' review ')).toBe('review')
    expect(defaultStepNameStage('Edit')).toBe('edit')
  })

  it('devuelve null para nombres personalizados o vacíos', () => {
    expect(defaultStepNameStage('Revisión legal')).toBeNull()
    expect(defaultStepNameStage(null)).toBeNull()
    expect(defaultStepNameStage('')).toBeNull()
  })
})
