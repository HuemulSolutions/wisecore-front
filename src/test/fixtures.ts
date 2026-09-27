/**
 * Datos de prueba compartidos. Los ids son estables para poder compararlos en
 * aserciones; los emails usan subdominios de example.com.
 */
import type { User, UserOrganization } from '@/types/users'
import type { AuthType } from '@/types/auth-types'

export const ORG_A_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
export const ORG_B_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
export const USER_ID = '11111111-1111-1111-1111-111111111111'
export const ROOT_ADMIN_ID = '99999999-9999-4999-8999-999999999999'
export const MICROSOFT_CONNECTION_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
export const GOOGLE_CONNECTION_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
export const INTERNAL_CONNECTION_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'

export const activeUser: User = {
  id: USER_ID,
  email: 'ada@example.com',
  name: 'Ada',
  last_name: 'Lovelace',
  status: 'active',
  activated_at: '2026-01-01T00:00:00Z',
  external_id: null,
  auth_type_id: INTERNAL_CONNECTION_ID,
  is_root_admin: false,
  photo_url: null,
  user_metadata: null,
  notify_daily_digest: false,
  roles: [],
} as unknown as User

export const rootAdmin: User = {
  ...activeUser,
  id: ROOT_ADMIN_ID,
  email: 'root@example.com',
  name: 'Root',
  last_name: 'Admin',
  is_root_admin: true,
} as unknown as User

export const orgA: UserOrganization = {
  id: ORG_A_ID,
  name: 'Org A',
  db_name: 'wic_org_a',
  description: 'Organización A',
  max_users: null,
  token_limit: null,
  tier: 'starter',
  member: true,
} as unknown as UserOrganization

export const orgB: UserOrganization = {
  ...orgA,
  id: ORG_B_ID,
  name: 'Org B',
  db_name: 'wic_org_b',
  description: 'Organización B',
} as unknown as UserOrganization

export const orgNotMember: UserOrganization = {
  ...orgA,
  id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
  name: 'Org sin membresía',
  db_name: 'wic_org_c',
  member: false,
} as unknown as UserOrganization

export const microsoftSso = {
  connection_id: MICROSOFT_CONNECTION_ID,
  name: 'Microsoft Contoso',
  type: 'microsoft' as const,
  authorize_url: `http://api.test/api/v1/auth/sso/${MICROSOFT_CONNECTION_ID}/start?login_hint=ada%40example.com`,
}

export const googleSso = {
  connection_id: GOOGLE_CONNECTION_ID,
  name: 'Google Workspace',
  type: 'google' as const,
  authorize_url: `http://api.test/api/v1/auth/sso/${GOOGLE_CONNECTION_ID}/start`,
}

/** Payloads de `POST /auth/codes` por `auth_flow` (contrato de docs/sso.md §4). */
export const authFlow = {
  internalCode: { auth_flow: 'internal_code', message: 'Login code generated and sent.', expires_at: '2026-01-01T00:15:00Z' },
  preauthCode: { auth_flow: 'preauth_code', message: 'Verification code generated and sent.', expires_at: '2026-01-01T00:15:00Z' },
  sso: { auth_flow: 'sso', message: 'This user must authenticate with the organization\'s identity provider.', sso: microsoftSso },
  chooseOrganization: (preauthToken: string) => ({
    auth_flow: 'choose_organization',
    message: 'Choose the organization to sign in to.',
    preauth_token: preauthToken,
    organizations: [
      { id: ORG_A_ID, name: 'Org A', method: { kind: 'internal_code', type: 'internal', name: 'Internal Authentication' } },
      { id: ORG_B_ID, name: 'Org B', method: { kind: 'sso', type: 'microsoft', name: 'Microsoft Contoso', connection_id: MICROSOFT_CONNECTION_ID } },
    ],
  }),
}

/** Conexiones de `GET /auth_types` (Fase 5/6): interna global, Microsoft de Org A y Google inactiva de Org A. */
export const internalConnection: AuthType = {
  id: INTERNAL_CONNECTION_ID,
  name: 'Internal Authentication',
  type: 'internal',
  params: null,
  organization_id: null,
  is_active: true,
  email_domains: [],
  has_client_secret: false,
  is_sso: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const microsoftConnection: AuthType = {
  id: MICROSOFT_CONNECTION_ID,
  name: 'Microsoft Contoso',
  type: 'microsoft',
  params: { client_id: 'app-1', tenant_id: null, allowed_tenant_ids: ['t1'], auto_provision: 'off' },
  organization_id: ORG_A_ID,
  is_active: true,
  email_domains: ['contoso.example.com'],
  has_client_secret: true,
  is_sso: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

export const googleConnection: AuthType = {
  id: GOOGLE_CONNECTION_ID,
  name: 'Google Workspace',
  type: 'google',
  params: { client_id: 'g-1', allowed_hosted_domains: ['contoso.example.com'], auto_provision: 'active' },
  organization_id: ORG_A_ID,
  is_active: false,
  email_domains: [],
  has_client_secret: false,
  is_sso: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

/** Método de membresía tal como lo devuelven `GET /organizations/{id}/users` y `GET /users/organizations`. */
export const internalMembership = { id: INTERNAL_CONNECTION_ID, name: 'Internal Authentication', type: 'internal' }
export const microsoftMembership = { id: MICROSOFT_CONNECTION_ID, name: 'Microsoft Contoso', type: 'microsoft' }
export const googleMembership = { id: GOOGLE_CONNECTION_ID, name: 'Google Workspace', type: 'google' }
