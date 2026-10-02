import { describe, expect, it } from 'vitest'

import { templateTitle } from './launcher-templates'

describe('templateTitle', () => {
  it('prefiere relation_name al nombre del template', () => {
    expect(templateTitle({ name: 'Plantilla RRHH v2', relation_name: 'Solicitud de vacaciones' })).toBe(
      'Solicitud de vacaciones',
    )
  })

  it('cae al nombre del template sin relation_name', () => {
    expect(templateTitle({ name: 'Plantilla RRHH v2', relation_name: null })).toBe('Plantilla RRHH v2')
    expect(templateTitle({ name: 'Plantilla RRHH v2' })).toBe('Plantilla RRHH v2')
  })
})
