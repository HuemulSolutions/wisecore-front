import { describe, expect, it } from 'vitest'

import { interleaveGroups, reviewSelectClass } from './section-bar-styles'

const sep = (i: number) => `|${i}`

describe('interleaveGroups', () => {
  it('intercala un separador entre grupos', () => {
    expect(interleaveGroups(['a', 'b', 'c'], sep)).toEqual(['a', '|1', 'b', '|2', 'c'])
  })

  it('descarta grupos vacíos: sin separador colgando ni doble', () => {
    expect(interleaveGroups([false, 'b', null, 'c', undefined], sep)).toEqual(['b', '|1', 'c'])
    expect(interleaveGroups([false, 'c'], sep)).toEqual(['c'])
  })

  it('sin grupos devuelve vacío', () => {
    expect(interleaveGroups([false, null], sep)).toEqual([])
  })
})

describe('reviewSelectClass', () => {
  it('aplica el color del estado', () => {
    expect(reviewSelectClass('reviewing', false)).toContain('text-[#b45309]')
    expect(reviewSelectClass('rejected', false)).toContain('bg-[#fef2f2]')
  })

  it('solo lectura agrega el filete inset y cursor default', () => {
    const cls = reviewSelectClass('editing', true)
    expect(cls).toContain('ring-inset')
    expect(cls).toContain('cursor-default')
    expect(reviewSelectClass('editing', false)).not.toContain('ring-inset')
  })

  it('sin estado usa el tono neutro', () => {
    expect(reviewSelectClass(null, false)).toContain('bg-[#f1f5f9]')
  })
})
