/**
 * `setMembershipAuthMethod`: el backend autoriza al org admin por `is_org_admin`, que
 * solo viaja en el token de organización; httpClient manda el de login a `/organizations/...`.
 */
import { http } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import { setMembershipAuthMethod } from '@/services/organizations'
import { server } from '@/test/msw/server'
import { respondOk } from '@/test/msw/respond'
import { ORG_A_ID, ORG_B_ID } from '@/test/fixtures'

const LOGIN_TOKEN = 'login-token'
const ORG_TOKEN = 'org-token'
const USER_ID = 'user-1'
const AUTH_TYPE_ID = 'auth-type-1'

function captureAuthMethodPatch(organizationId: string) {
  const seen: { authorization: string | null; orgId: string | null }[] = []
  server.use(
    http.patch(`${backendUrl}/organizations/${organizationId}/users/${USER_ID}/auth-method`, ({ request }) => {
      seen.push({ authorization: request.headers.get('Authorization'), orgId: request.headers.get('X-Org-Id') })
      return respondOk({ user_id: USER_ID, organization_id: organizationId, auth_type_id: AUTH_TYPE_ID })
    }),
  )
  return seen
}

afterEach(() => {
  httpClient.setLoginToken(null)
  httpClient.setOrganizationToken(null)
  httpClient.setOrganizationId(null)
})

describe('setMembershipAuthMethod', () => {
  it('con la organización activa usa su token (org admin)', async () => {
    httpClient.setLoginToken(LOGIN_TOKEN)
    httpClient.setOrganizationToken(ORG_TOKEN)
    httpClient.setOrganizationId(ORG_A_ID)
    const seen = captureAuthMethodPatch(ORG_A_ID)

    await setMembershipAuthMethod(ORG_A_ID, USER_ID, AUTH_TYPE_ID)

    expect(seen).toEqual([{ authorization: `Bearer ${ORG_TOKEN}`, orgId: ORG_A_ID }])
  })

  it('con otra organización deja el token de login (root admin cross-org)', async () => {
    httpClient.setLoginToken(LOGIN_TOKEN)
    httpClient.setOrganizationToken(ORG_TOKEN)
    httpClient.setOrganizationId(ORG_A_ID)
    const seen = captureAuthMethodPatch(ORG_B_ID)

    await setMembershipAuthMethod(ORG_B_ID, USER_ID, AUTH_TYPE_ID)

    expect(seen).toEqual([{ authorization: `Bearer ${LOGIN_TOKEN}`, orgId: ORG_B_ID }])
  })
})
