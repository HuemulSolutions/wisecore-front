import type { ReactNode } from 'react'
import type { Permission } from '@/types/jwt-utils'
import type { User } from '@/types/users'

// ==================== Form Props ====================

/**
 * Props para el formulario de login
 */
export interface LoginFormProps extends React.ComponentProps<"div"> {
  /** El backend respondió a `POST /auth/codes`; el caller decide el paso siguiente según `auth_flow`. */
  onCodeRequested?: (result: RequestCodeResult, email: string) => void;
  /** Email prellenado (p. ej. desde `/login?email=`). */
  initialEmail?: string;
  /** Email fijo (step-up): no se puede editar. */
  lockedEmail?: boolean;
}

/**
 * Props para el formulario de verificación OTP
 */
export interface OTPFormProps extends React.ComponentProps<"div"> {
  /** Email del usuario */
  email: string;
  /** `login`: código de acceso (caso B). `preauth`: código de verificación inicial (caso C). Solo cambia el copy. */
  variant?: "login" | "preauth";
  /** Callback para volver al formulario anterior */
  onBack?: () => void;
  /** El código se verificó: token (caso B) o lista de organizaciones (caso C). */
  onVerified: (result: VerifyCodeResult) => void;
  /** Reenvío del código; lo inyecta el orquestador (`/codes`). */
  onResend: () => Promise<unknown>;
}

// ==================== Protected Route Props ====================

/**
 * Props básicas para una ruta protegida (solo autenticación)
 */
export interface BasicProtectedRouteProps {
  /** Contenido a renderizar si el usuario está autenticado */
  children: ReactNode;
}

/**
 * Props para una ruta protegida con verificación de permisos
 */
export interface ProtectedRouteWithPermissionsProps {
  /** Contenido a renderizar si el usuario tiene los permisos necesarios */
  children: ReactNode;

  permission?: Permission | string;
  permissions?: (Permission | string)[];
  requireAllPermissions?: boolean;

  role?: string;
  roles?: string[];
  requireAllRoles?: boolean;

  resource?: string;
  resourceAction?: 'c' | 'r' | 'u' | 'd' | 'l' | 'manage';
  resourceActions?: ('c' | 'r' | 'u' | 'd' | 'l' | 'manage')[];

  requireRootAdmin?: boolean;
  /** Root admin O admin de la organización activa (ver `RbacPageSpec.requireOrgAdmin`). */
  requireOrgAdmin?: boolean;
  redirectTo?: string;
  showErrorPage?: boolean;
}

// ==================== Auth State ====================

export type AuthPurpose = 'login';

export type ResourceAction = 'c' | 'r' | 'u' | 'd' | 'l' | 'manage';

// ==================== Service Auth Types ====================

export interface RequestCodeRequest {
  email: string;
  purpose: 'login';
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface UpdateUserRequest {
  name: string;
  last_name: string;
  birthdate?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ==================== Login flow (docs/sso-frontend.md §2) ====================

export type LoginMethodKind = 'internal_code' | 'sso';
export type SsoProviderType = 'microsoft' | 'google';

/** Conexión SSO a la que redirigir: `authorize_url` es una URL del backend. */
export interface SsoFlowPayload {
  connection_id: string;
  name: string;
  type: SsoProviderType | string;
  authorize_url: string;
}

export interface LoginOrganizationOption {
  id: string;
  name: string;
  method: {
    kind: LoginMethodKind;
    type: string;
    name: string | null;
    connection_id?: string;
  };
}

/**
 * Respuesta de `POST /auth/codes` (purpose=login), discriminada por `auth_flow`.
 * La lista de organizaciones nunca sale de acá: el caso C pide antes el código
 * preauth y la lista llega en `verify`.
 */
export type RequestCodeResult =
  | { auth_flow: 'internal_code'; expires_at?: string | null }
  | { auth_flow: 'preauth_code'; expires_at?: string | null }
  | { auth_flow: 'sso'; sso: SsoFlowPayload };

/** Respuesta de `POST /auth/codes/verify`. */
export type VerifyCodeResult =
  | { kind: 'token'; token: string; user: User }
  | { kind: 'choose_organization'; preauth_token: string; organizations: LoginOrganizationOption[] };

/**
 * Respuesta de `POST /auth/login/select`: el backend aplica el método de la membresía.
 * El preauth ya verificó la casilla, así que una membresía por código entrega el token
 * directo; una SSO manda al proveedor.
 */
export type SelectOrganizationResult =
  | { kind: 'token'; token: string; user: User; organization: { id: string; name: string } | null }
  | { kind: 'sso'; sso: SsoFlowPayload; organization: { id: string; name: string } | null };

export interface SelectOrganizationRequest {
  preauth_token: string;
  organization_id: string;
}

/** Respuesta de `POST /auth/sso/exchange`. */
export interface SsoExchangeResult {
  token: string;
  user: User;
  return_to: string | null;
}

/** `required_auth_flow` del 403 `AUTH_METHOD_REQUIRED` (step-up). */
export type RequiredAuthFlow =
  | { auth_flow: 'internal_code' }
  | { auth_flow: 'sso'; sso: SsoFlowPayload };

export interface AuthMethodRequiredDetail {
  message?: string;
  required_auth_flow: RequiredAuthFlow;
}

/** Códigos fijos que el backend manda en `/auth/sso/callback?error=`. */
export type SsoErrorCode =
  | 'invalid_state'
  | 'idp_error'
  | 'token_exchange_failed'
  | 'invalid_id_token'
  | 'tenant_not_allowed'
  | 'domain_not_allowed'
  | 'email_missing'
  | 'email_not_verified'
  | 'account_conflict'
  | 'identity_taken'
  | 'user_not_found'
  | 'user_not_active'
  | 'connection_disabled'
  | 'sso_disabled'
  | 'discovery_failed'
  | 'handoff_invalid';
