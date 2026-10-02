/**
 * `useDiscussions` no pide nada sin `discussion:l`: el editor lo monta en cada sección y, sin este
 * gate, quien solo puede ver el activo recibía un 403 y el toast "No tienes permiso".
 */
import { http } from 'msw'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { useDiscussions } from '@/hooks/useDiscussions'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { activeUser, ORG_A_ID } from '@/test/fixtures'
import { makeLoginToken, makeOrgToken } from '@/test/jwt'

function Probe() {
  const { discussions } = useDiscussions('doc-1')
  return <p>discusiones:{discussions.length}</p>
}

const session = { token: makeLoginToken({ sub: activeUser.id }), user: activeUser }
const org = (permissions: string[]) => ({
  id: ORG_A_ID,
  token: makeOrgToken({ sub: activeUser.id, is_org_admin: false, permissions }),
})

function trackDiscussionRequests() {
  const requested: string[] = []
  server.use(
    http.get(`${backendUrl}/discussions/`, ({ request }) => {
      requested.push(new URL(request.url).search)
      return respondOk([])
    }),
    http.get(`${backendUrl}/user_roles/members`, () => respondOk([])),
  )
  return requested
}

describe('useDiscussions · permisos', () => {
  it('con discussion:l pide las discusiones del activo', async () => {
    const requested = trackDiscussionRequests()
    renderWithProviders(<Probe />, { session, org: org(['asset:r', 'discussion:l']) })
    await waitFor(() => expect(requested).toHaveLength(1))
    expect(requested[0]).toContain('document_id=doc-1')
  })

  it('sin discussion:l no pide nada', async () => {
    const requested = trackDiscussionRequests()
    renderWithProviders(<Probe />, { session, org: org(['asset:r']) })
    expect(await screen.findByText('discusiones:0')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(requested).toEqual([])
  })
})
