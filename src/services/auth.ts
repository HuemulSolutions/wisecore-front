import { backendUrl } from '@/config';
import { httpClient } from '@/lib/http-client';
import { logger } from '@/lib/logger';
import type { User } from '@/types';
import type {
  AuthResponse,
  LoginOrganizationOption,
  RequestCodeRequest,
  RequestCodeResult,
  SelectOrganizationRequest,
  SelectOrganizationResult,
  SsoExchangeResult,
  SsoFlowPayload,
  UpdateUserRequest,
  VerifyCodeRequest,
  VerifyCodeResult,
} from '@/types/auth';

export type { RequestCodeRequest, VerifyCodeRequest, UpdateUserRequest, AuthResponse };

const KNOWN_AUTH_FLOWS = new Set(['internal_code', 'preauth_code', 'sso', 'choose_organization']);

/** Lanzado cuando el backend responde un `auth_flow` que este frontend no conoce (p. ej. `saml2`). */
export class UnsupportedAuthFlowError extends Error {
  readonly authFlow: string;

  constructor(authFlow: string) {
    super(`unsupported_auth_flow:${authFlow}`);
    this.name = 'UnsupportedAuthFlowError';
    this.authFlow = authFlow;
  }
}

type Envelope<T> = { data?: T };

function hasTokenAndUser(value: unknown): value is { token: string; user: User } {
  const v = value as { token?: unknown; user?: unknown } | null;
  return !!v && typeof v.token === 'string' && !!v.user && typeof v.user === 'object';
}

function hasChooseOrganization(value: unknown): value is { preauth_token: string; organizations: unknown[] } {
  const v = value as { auth_flow?: unknown; preauth_token?: unknown; organizations?: unknown } | null;
  return (
    !!v &&
    v.auth_flow === 'choose_organization' &&
    typeof v.preauth_token === 'string' &&
    Array.isArray(v.organizations)
  );
}

class AuthService {
  private baseUrl = `${backendUrl}/auth`;

  /**
   * Paso 1 del login. Devuelve el `auth_flow` que decidió el backend
   * (docs/sso-frontend.md §2). El caller decide la pantalla siguiente.
   */
  async requestCode(request: RequestCodeRequest): Promise<RequestCodeResult> {
    logger.log('AuthService: Requesting code to', `${this.baseUrl}/codes`, 'with purpose:', request.purpose);

    const response = await httpClient.post(`${this.baseUrl}/codes`, {
      email: request.email.toLowerCase(),
      purpose: request.purpose,
    });
    const body = (await response.json()) as Envelope<RequestCodeResult & { auth_flow?: string }>;
    const data = body?.data;
    const authFlow = typeof data?.auth_flow === 'string' ? data.auth_flow : 'internal_code';
    if (!KNOWN_AUTH_FLOWS.has(authFlow)) {
      logger.error('AuthService: unsupported auth_flow', authFlow);
      throw new UnsupportedAuthFlowError(authFlow);
    }
    if (authFlow === 'sso' && !(data as { sso?: unknown })?.sso) {
      throw new Error('Invalid response from server');
    }
    if (authFlow === 'choose_organization' && !hasChooseOrganization(data)) {
      throw new Error('Invalid response from server');
    }
    return { ...(data as object), auth_flow: authFlow } as RequestCodeResult;
  }

  /** Paso 2 del login por código. Caso B → token; caso C → elegir organización. */
  async verifyCode(request: VerifyCodeRequest): Promise<VerifyCodeResult> {
    logger.log('AuthService: Verifying code to', `${this.baseUrl}/codes/verify`, 'for email:', request.email.toLowerCase());

    const response = await httpClient.post(`${this.baseUrl}/codes/verify`, {
      email: request.email.toLowerCase(),
      code: request.code,
    });
    const body = (await response.json()) as Envelope<unknown>;
    const data = body?.data;
    logger.log('Raw verifyCode response, token present:', hasTokenAndUser(data));

    if (hasTokenAndUser(data)) {
      return { kind: 'token', token: data.token, user: data.user };
    }
    if (hasChooseOrganization(data)) {
      return {
        kind: 'choose_organization',
        preauth_token: data.preauth_token,
        organizations: data.organizations as LoginOrganizationOption[],
      };
    }
    logger.error('Invalid response structure:', body);
    throw new Error('Invalid response from server');
  }

  /** Caso C: el usuario eligió organización; el backend aplica el método de esa membresía. */
  async selectLoginOrganization(request: SelectOrganizationRequest): Promise<SelectOrganizationResult> {
    const response = await httpClient.post(`${this.baseUrl}/login/select`, request);
    const body = (await response.json()) as Envelope<Record<string, unknown>>;
    const data = body?.data ?? {};
    const organization = (data.organization as { id: string; name: string } | undefined) ?? null;

    if (hasTokenAndUser(data)) {
      return { kind: 'token', token: data.token, user: data.user, organization };
    }
    if (data.auth_flow === 'sso' && data.sso) {
      return { kind: 'sso', sso: data.sso as SsoFlowPayload, organization };
    }
    if (data.auth_flow === 'internal_code') {
      return { kind: 'internal_code', expires_at: (data.expires_at as string | null) ?? null, organization };
    }
    logger.error('Invalid response structure:', body);
    throw new Error('Invalid response from server');
  }

  /** Canjea el handoff code de `/auth/sso/callback?code=` por el token app (un solo uso). */
  async exchangeSsoCode(code: string): Promise<SsoExchangeResult> {
    const response = await httpClient.post(`${this.baseUrl}/sso/exchange`, { code });
    const body = (await response.json()) as Envelope<Record<string, unknown>>;
    const data = body?.data ?? {};
    const returnTo = typeof data.return_to === 'string' ? data.return_to : null;
    if (!hasTokenAndUser(data)) {
      logger.error('Invalid response structure:', body);
      throw new Error('Invalid response from server');
    }
    return { token: data.token, user: data.user, return_to: returnTo };
  }

  async updateUser(userId: string, request: UpdateUserRequest): Promise<User> {
    logger.log('AuthService: Updating user', userId, 'with data:', request);

    const response = await httpClient.put(`${backendUrl}/users/${userId}`, request);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to update user');
    }

    const responseData = await response.json();
    logger.log('Raw updateUser response:', responseData);

    return responseData.data || responseData;
  }
}

export const authService = new AuthService();
