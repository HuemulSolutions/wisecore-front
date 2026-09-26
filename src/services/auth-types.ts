import { backendUrl } from '@/config';
import { httpClient } from '@/lib/http-client';
import type { AuthType, CreateAuthTypeRequest, UpdateAuthTypeRequest, AuthTypesResponse, AuthTypeResponse, AuthTypeTypesResponse } from '@/types/auth-types';

export type { AuthType, CreateAuthTypeRequest, UpdateAuthTypeRequest, AuthTypesResponse, AuthTypeResponse, AuthTypeTypesResponse };

/**
 * Tolera un backend anterior al plan SSO (sin `is_active`, `email_domains`,
 * `has_client_secret`, `is_sso`, `organization_id`): la tabla no debe romperse
 * durante la ventana entre el deploy del front y el del backend
 * (docs/sso-frontend.md §7).
 */
export function normalizeAuthType(raw: Partial<AuthType> & Record<string, unknown>): AuthType {
  const type = (raw.type as string) ?? 'internal';
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    type: type as AuthType['type'],
    params: (raw.params as AuthType['params']) ?? null,
    organization_id: (raw.organization_id as string | null | undefined) ?? null,
    is_active: raw.is_active ?? true,
    email_domains: Array.isArray(raw.email_domains) ? (raw.email_domains as string[]) : [],
    has_client_secret: raw.has_client_secret ?? false,
    is_sso: raw.is_sso ?? type !== 'internal',
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  };
}

class AuthTypesService {
  private baseUrl = `${backendUrl}/auth_types`;

  async getAuthTypes(search?: string, options: { organizationId?: string | null; onlyActive?: boolean } = {}): Promise<AuthType[]> {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (options.organizationId) query.set('organization_id', options.organizationId);
    if (options.onlyActive) query.set('only_active', 'true');
    const qs = query.toString();
    const response = await httpClient.get(qs ? `${this.baseUrl}/?${qs}` : `${this.baseUrl}/`);
    const data: AuthTypesResponse = await response.json();
    return (data.data ?? []).map((item) => normalizeAuthType(item as unknown as Record<string, unknown>));
  }

  async getAuthType(id: string): Promise<AuthType> {
    const response = await httpClient.get(`${this.baseUrl}/${id}`);
    const data: AuthTypeResponse = await response.json();
    return normalizeAuthType(data.data as unknown as Record<string, unknown>);
  }

  async getAuthTypeTypes(): Promise<string[]> {
    const response = await httpClient.get(`${this.baseUrl}/types`);
    const data: AuthTypeTypesResponse = await response.json();
    return data.data;
  }

  async createAuthType(data: CreateAuthTypeRequest): Promise<AuthType> {
    const response = await httpClient.post(`${this.baseUrl}/`, data);
    const result: AuthTypeResponse = await response.json();
    return normalizeAuthType(result.data as unknown as Record<string, unknown>);
  }

  async updateAuthType(id: string, data: UpdateAuthTypeRequest): Promise<AuthType> {
    const response = await httpClient.put(`${this.baseUrl}/${id}`, data);
    const result: AuthTypeResponse = await response.json();
    return normalizeAuthType(result.data as unknown as Record<string, unknown>);
  }

  async deleteAuthType(id: string): Promise<void> {
    await httpClient.delete(`${this.baseUrl}/${id}`);
  }
}

export const authTypesService = new AuthTypesService();

// Export individual functions for use in hooks
export const getAuthTypes = (search?: string, options?: { organizationId?: string | null; onlyActive?: boolean }) =>
  authTypesService.getAuthTypes(search, options);
export const getAuthType = (id: string) => authTypesService.getAuthType(id);
export const getAuthTypeTypes = () => authTypesService.getAuthTypeTypes();
export const createAuthType = (data: CreateAuthTypeRequest) => authTypesService.createAuthType(data);
export const updateAuthType = (id: string, data: UpdateAuthTypeRequest) => authTypesService.updateAuthType(id, data);
export const deleteAuthType = (id: string) => authTypesService.deleteAuthType(id);
