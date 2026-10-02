import { describe, expect, it } from 'vitest'

import { diffCollectionAccess, hasAccessChanges } from './collection-access-diff'

const role = (id: string, access_level: 'read' | 'admin' = 'read') => ({ role_id: id, user_id: null, access_level })
const person = (id: string, access_level: 'read' | 'admin' = 'read') => ({ role_id: null, user_id: id, access_level })

describe('diffCollectionAccess', () => {
  it('solo manda lo nuevo, lo que cambió de nivel y lo quitado', () => {
    const saved = [role('r1'), role('r2', 'admin'), person('u1')]
    const draft = [role('r1'), role('r2', 'read'), person('u2', 'admin')]

    expect(diffCollectionAccess(saved, draft)).toEqual({
      add: [role('r2', 'read'), person('u2', 'admin')],
      remove: [{ role_id: null, user_id: 'u1' }],
    })
  })

  it('sin cambios no hay nada que mandar', () => {
    const saved = [role('r1'), person('u1', 'admin')]
    const changes = diffCollectionAccess(saved, [...saved])

    expect(changes).toEqual({ add: [], remove: [] })
    expect(hasAccessChanges(changes)).toBe(false)
  })

  it('un rol y una persona con el mismo id son principales distintos', () => {
    expect(diffCollectionAccess([role('x')], [person('x')])).toEqual({
      add: [person('x')],
      remove: [{ role_id: 'x', user_id: null }],
    })
  })
})
