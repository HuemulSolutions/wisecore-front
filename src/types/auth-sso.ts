/**
 * Tipos del módulo `auth-sso` (identidades vinculadas e invitaciones), contrato
 * de `wisecore-backend` `src/modules/auth_sso` (docs/sso.md §5).
 */

export interface UserIdentity {
  id: string
  auth_type_id: string
  email: string | null
  last_login_at: string | null
  created_at: string | null
}

export interface LinkIdentityResult {
  authorize_url: string
}

export interface Invitation {
  id: string
  email: string
  auth_type_id: string
  user_id: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string | null
}

export interface CreateInvitationRequest {
  email: string
  auth_type_id: string
  user_id?: string | null
}

export interface CreatedInvitation extends Omit<Invitation, 'accepted_at' | 'created_at'> {
  organization_id: string
  connection_name: string
  connection_type: string
}

export interface UserIdentitiesResponse {
  data: UserIdentity[]
  transaction_id: string
  timestamp: string
}

export interface LinkIdentityResponse {
  data: LinkIdentityResult
  transaction_id: string
  timestamp: string
}

export interface InvitationsResponse {
  data: Invitation[]
  transaction_id: string
  timestamp: string
}

export interface CreatedInvitationResponse {
  data: CreatedInvitation
  transaction_id: string
  timestamp: string
}
