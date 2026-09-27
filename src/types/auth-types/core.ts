/**
 * Conexiones de autenticación (`/api/v1/auth_types`), contrato de docs/sso-frontend.md §2.
 *
 * Cada fila es una conexión: la `internal` global (código por correo) más N
 * conexiones SSO por organización. `client_secret` es write-only: la API expone
 * solo `has_client_secret`.
 */
export type AuthTypeKind = 'internal' | 'microsoft' | 'google';

export const SSO_AUTH_TYPE_KINDS: readonly AuthTypeKind[] = ['microsoft', 'google'];

export type AutoProvision = 'off' | 'pending' | 'active';

export interface MicrosoftParams {
  client_id: string;
  /** Vacío/null = `organizations` (multi-tenant). */
  tenant_id?: string | null;
  allowed_tenant_ids: string[];
  auto_provision: AutoProvision;
}

export interface GoogleParams {
  client_id: string;
  allowed_hosted_domains: string[];
  auto_provision: AutoProvision;
}

export type AuthTypeParams = MicrosoftParams | GoogleParams;

export interface AuthType {
  id: string;
  name: string;
  type: AuthTypeKind;
  params: AuthTypeParams | null;
  /** null = conexión global (solo root admin). */
  organization_id: string | null;
  is_active: boolean;
  email_domains: string[];
  has_client_secret: boolean;
  is_sso: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAuthTypeRequest {
  name: string;
  type: AuthTypeKind;
  params?: AuthTypeParams | null;
  organization_id?: string | null;
  email_domains?: string[];
  is_active?: boolean;
  /** Write-only. */
  client_secret?: string;
}

/** `PUT` parcial: se manda solo lo que cambió. `organization_id` no se puede mover. */
export type UpdateAuthTypeRequest = Partial<Omit<CreateAuthTypeRequest, 'organization_id'>>;

export interface AuthTypesResponse {
  data: AuthType[];
  transaction_id: string;
  timestamp: string;
}

export interface AuthTypeResponse {
  data: AuthType;
  transaction_id: string;
  timestamp: string;
}

export interface AuthTypeTypesResponse {
  data: string[];
  transaction_id: string;
  timestamp: string;
}

export function isSsoAuthType(type: string): type is Exclude<AuthTypeKind, 'internal'> {
  return (SSO_AUTH_TYPE_KINDS as readonly string[]).includes(type);
}

export function isMicrosoftParams(params: AuthTypeParams | null | undefined): params is MicrosoftParams {
  return !!params && 'allowed_tenant_ids' in params;
}

export function isGoogleParams(params: AuthTypeParams | null | undefined): params is GoogleParams {
  return !!params && 'allowed_hosted_domains' in params;
}
