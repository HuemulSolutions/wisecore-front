/**
 * "Lo mío" en las discusiones: el autor actúa sobre lo suyo solo si puede comentar. Es la regla
 * que comparten el panel de discusiones, el encabezado del hilo y cada comentario.
 */
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useOwnCommentRights } from '@/hooks/useOwnCommentRights'
import { renderWithProviders } from '@/test/render'
import { activeUser, ORG_A_ID } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'

function Probe() {
  const { isOwnAndCanComment } = useOwnCommentRights()
  return (
    <ul>
      <li>own:{String(isOwnAndCanComment('me', 'me'))}</li>
      <li>other:{String(isOwnAndCanComment('me', 'someone-else'))}</li>
      <li>anonymous:{String(isOwnAndCanComment(null, null))}</li>
    </ul>
  )
}

const session = { token: makeLoginToken({ sub: activeUser.id }), user: activeUser }
const org = (permissions: string[]) => ({
  id: ORG_A_ID,
  token: makeOrgToken({ sub: activeUser.id, is_org_admin: false, permissions }),
})

describe('useOwnCommentRights', () => {
  it('con discussion:c el autor actúa sobre lo suyo y solo sobre lo suyo', async () => {
    renderWithProviders(<Probe />, { session, org: org(['discussion:l', 'discussion:c']) })
    expect(await screen.findByText('own:true')).toBeInTheDocument()
    expect(screen.getByText('other:false')).toBeInTheDocument()
    expect(screen.getByText('anonymous:false')).toBeInTheDocument()
  })

  it('sin discussion:c lo suyo también es de solo lectura', async () => {
    renderWithProviders(<Probe />, { session, org: org(['discussion:l']) })
    expect(await screen.findByText('own:false')).toBeInTheDocument()
  })
})
