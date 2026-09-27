/**
 * Endpoints autenticados del SSO (`/api/v1/auth-sso/*`).
 *
 * OJO: la URL contiene `/auth-sso/`, no `/auth/`: `httpClient` los trata como
 * endpoints de organización (token de org + `X-Org-Id`). Es a propósito: el
 * backend lee `is_org_admin` del token de organización para las invitaciones.
 */
import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  CreatedInvitation,
  CreatedInvitationResponse,
  CreateInvitationRequest,
  Invitation,
  InvitationsResponse,
  LinkIdentityResponse,
  LinkIdentityResult,
  UserIdentitiesResponse,
  UserIdentity,
} from '@/types/auth-sso'

const BASE_URL = `${backendUrl}/auth-sso`

export async function getMyIdentities(): Promise<UserIdentity[]> {
  const response = await httpClient.get(`${BASE_URL}/identities/me`)
  const data = (await response.json()) as UserIdentitiesResponse
  return data.data
}

/**
 * Inicia la vinculación de una identidad nueva desde la sesión. Devuelve la
 * `authorize_url` del backend; el caller hace `window.location.assign` y el IdP
 * vuelve por `/auth/sso/callback?linked=1`.
 */
export async function startLinkIdentity(connectionId: string, returnTo?: string | null): Promise<LinkIdentityResult> {
  const query = returnTo ? `?${new URLSearchParams({ return_to: returnTo })}` : ''
  const response = await httpClient.post(`${BASE_URL}/${connectionId}/link${query}`)
  const data = (await response.json()) as LinkIdentityResponse
  return data.data
}

export async function listInvitations(organizationId: string, includeAccepted = false): Promise<Invitation[]> {
  const query = includeAccepted ? '?include_accepted=true' : ''
  const response = await httpClient.get(`${BASE_URL}/invitations${query}`, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as InvitationsResponse
  return data.data
}

export async function createInvitation(organizationId: string, body: CreateInvitationRequest): Promise<CreatedInvitation> {
  const response = await httpClient.post(`${BASE_URL}/invitations`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as CreatedInvitationResponse
  return data.data
}
