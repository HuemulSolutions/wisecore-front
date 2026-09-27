import { backendUrl } from "@/config";
import { httpClient } from "@/lib/http-client";
import { logger } from "@/lib/logger";
import type { UserOrganization } from "@/types/users";
import type { Organization, OrganizationUser, OrganizationUsersResponse, SetOrganizationAdminResponse } from '@/types/organizations';

export type { OrganizationUser, OrganizationUsersResponse, SetOrganizationAdminResponse };

export async function getUserOrganizations(userId: string): Promise<UserOrganization[]> {
  logger.log('getUserOrganizations called for userId:', userId);
  logger.log('Current httpClient tokens state:', httpClient.getTokensState());
  logger.log('Current localStorage state:', httpClient.getLocalStorageState());
  
  const response = await httpClient.get(`${backendUrl}/users/organizations?user_id=${userId}`);
  const data = await response.json();
  logger.log('User organizations fetched:', data.data);
  return data.data;
}

export async function generateOrganizationToken(organizationId: string) {
  const response = await httpClient.post(`${backendUrl}/user_roles/user_token`, null, {
    headers: {
      'X-Org-Id': organizationId
    }
  });

  const data = await response.json();
  logger.log('Organization token generated:', data);
  return data;
}

export async function getAllOrganizations(page = 1, pageSize = 100, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search?.trim()) params.set('search', search.trim());
  const response = await httpClient.get(`${backendUrl}/organizations?${params}`);
  const data = await response.json();
  return data;
}

export async function addOrganization({ name, description }: { name: string; description?: string }): Promise<Organization> {
  const response = await httpClient.post(`${backendUrl}/organizations`, {
    name,
    description: description || null,
  });

  const data = await response.json();
  logger.log('Organization created:', data.data);
  return data.data;
}

export async function updateOrganization(
  organizationId: string, 
  { name, description, max_users, token_limit, default_auth_type_id }: {
    name: string;
    description?: string;
    max_users?: number | null;
    token_limit?: number | null;
    /** `null` limpia (vuelve a código por email); `undefined` no lo toca. */
    default_auth_type_id?: string | null;
  }
) {
  const body: Record<string, unknown> = {
    name,
    description: description || null,
  };

  // Solo incluir max_users y token_limit si estÃ¡n definidos
  if (max_users !== undefined) {
    body.max_users = max_users;
  }
  if (token_limit !== undefined) {
    body.token_limit = token_limit;
  }
  if (default_auth_type_id !== undefined) {
    body.default_auth_type_id = default_auth_type_id;
  }

  const response = await httpClient.patch(`${backendUrl}/organizations/${organizationId}`, body);

  const data = await response.json();
  logger.log('Organization updated:', data.data);
  return data.data;
}

export async function deleteOrganization(organizationId: string) {
  await httpClient.delete(`${backendUrl}/organizations/${organizationId}`);
  logger.log('Organization deleted:', organizationId);
}

// Get users of a specific organization (root admin only)
export async function getOrganizationUsers(
  organizationId: string,
  page = 1,
  pageSize = 100,
  search?: string
): Promise<OrganizationUsersResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });
  if (search?.trim()) {
    params.set('search', search.trim());
  }
  const response = await httpClient.get(
    `${backendUrl}/organizations/${organizationId}/users?${params.toString()}`,
    {
      headers: {
        'X-Org-Id': organizationId
      }
    }
  );
  return response.json();
}

// Set a user as organization admin (root admin only)
export async function setOrganizationAdmin(
  organizationId: string,
  userId: string
): Promise<SetOrganizationAdminResponse> {
  const response = await httpClient.post(
    `${backendUrl}/organizations/${organizationId}/admins`,
    { user_id: userId },
    {
      headers: {
        'X-Org-Id': organizationId
      }
    }
  );
  return response.json();
}

/**
 * Cambia el método de autenticación de una membresía (docs/sso-frontend.md, Fase 6).
 * `X-Org-Id` es la organización del path (no la activa): el backend exige que
 * coincidan y que el token sea root admin o admin de ESA organización (httpClient
 * elige el token de organización cuando es la activa).
 */
export async function setMembershipAuthMethod(
  organizationId: string,
  userId: string,
  authTypeId: string,
): Promise<{ user_id: string; organization_id: string; auth_type_id: string; auth_type: { id: string; name: string; type: string } }> {
  const response = await httpClient.patch(
    `${backendUrl}/organizations/${organizationId}/users/${userId}/auth-method`,
    { auth_type_id: authTypeId },
    { headers: { 'X-Org-Id': organizationId } },
  );
  const data = await response.json();
  return data.data;
}
