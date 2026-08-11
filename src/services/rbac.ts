import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';
import { downloadBlobResponse } from '@/lib/blob-download';
import type { RbacPermission, PermissionWithStatus, Role, RolesResponse, PermissionsResponse, PermissionsWithStatusResponse, UserRolesResponse, RoleWithAssignment, UserAllRolesResponse, UserWithAssignment, RoleWithAllUsersResponse, CreateRoleData, UpdateRoleData, AssignRolesData, CloneRoleData, ExportRolesBody, ImportRolesQueryParams, ImportRolesData, ImportRolesResponse } from '@/types/rbac';

export type { RbacPermission as Permission, PermissionWithStatus, Role, RolesResponse, PermissionsResponse, PermissionsWithStatusResponse, UserRolesResponse, RoleWithAssignment, UserAllRolesResponse, UserWithAssignment, RoleWithAllUsersResponse, CreateRoleData, UpdateRoleData, AssignRolesData, CloneRoleData, ExportRolesBody, ImportRolesQueryParams, ImportRolesData, ImportRolesResponse };

// httpClient inyecta Authorization y X-Org-Id desde el contexto de
// organización activo (ver src/lib/http-client.ts); ningún servicio debe leer
// `selectedOrganizationId` de localStorage a mano (fuga cross-org tras un
// cambio de organización — ver ia context/rbac-audit-guide.md).

// Get all roles
export const getRoles = async (page: number = 1, pageSize: number = 10, search?: string): Promise<RolesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });

  if (search && search.trim()) {
    params.set('search', search.trim());
  }

  const response = await httpClient.get(`${backendUrl}/rbac/roles/with_perm_count?${params.toString()}`);

  return response.json();
};

// Create new role
export const createRole = async (data: CreateRoleData): Promise<Role> => {
  const response = await httpClient.post(`${backendUrl}/rbac/roles`, data);

  return response.json();
};

// Get all permissions
export const getPermissions = async (search?: string): Promise<PermissionsResponse> => {
  const url = new URL(`${backendUrl}/rbac/permissions`);
  if (search?.trim()) {
    url.searchParams.append('search', search.trim());
  }
  const response = await httpClient.get(url.toString());

  return response.json();
};

// Get user roles
export const getUserRoles = async (userId: string): Promise<UserRolesResponse> => {
  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required');
  }

  const response = await httpClient.get(`${backendUrl}/rbac/users/${userId}/roles`);

  return response.json();
};

// Get all roles with user assignment status
export const getUserAllRoles = async (userId: string, page: number = 1, pageSize: number = 10, search?: string): Promise<UserAllRolesResponse> => {
  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required');
  }

  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
  });

  if (search && search.trim() !== '') {
    params.set('search', search.trim());
  }

  const response = await httpClient.get(`${backendUrl}/user_roles/user_all_roles/${userId}?${params.toString()}`);

  return response.json();
};

// Assign roles to user using bulk endpoint
export const assignRolesToUser = async (userId: string, data: AssignRolesData): Promise<void> => {
  await httpClient.post(`${backendUrl}/user_roles/bulk_role_assign/${userId}`, data);
};

// Assign specific role to user (new endpoint)
export const assignRoleToUser = async (userId: string, roleIds: string[]): Promise<void> => {
  await httpClient.fetch(`${backendUrl}/rbac/users/${userId}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role_ids: roleIds }),
  });
};

// Get permissions for a specific role with assignment status
export const getRolePermissions = async (roleId: string, search?: string, pageSize: number = 1000): Promise<PermissionsWithStatusResponse> => {
  const params = new URLSearchParams({
    page: '1',
    page_size: pageSize.toString(),
  });
  if (search && search.trim()) {
    params.set('search', search.trim());
  }
  const response = await httpClient.get(`${backendUrl}/rbac/roles/${roleId}/permissions_with_status?${params.toString()}`);

  const result = await response.json();
  return result;
};

// Update role (name/description/permissions diff/position hierarchy) using PATCH endpoint
export const updateRole = async (roleId: string, data: UpdateRoleData): Promise<Role> => {
  const response = await httpClient.patch(`${backendUrl}/rbac/roles/${roleId}`, data);

  const result = await response.json();
  return result.data;
};

// Delete role (if endpoint exists)
export const deleteRole = async (roleId: string): Promise<void> => {
  await httpClient.delete(`${backendUrl}/rbac/roles/${roleId}`);
};

// Get role with all users and their assignment status
export const getRoleWithAllUsers = async (
  roleId: string,
  page?: number,
  pageSize?: number,
  search?: string
): Promise<RoleWithAllUsersResponse> => {
  const params = new URLSearchParams();
  params.append('role_id', roleId);
  if (page) params.append('page', page.toString());
  if (pageSize) params.append('page_size', pageSize.toString());
  if (search) params.append('search', search);

  const response = await httpClient.get(`${backendUrl}/user_roles/role_with_all_users?${params.toString()}`);

  return response.json();
};

// Assign users to a role
export const assignUsersToRole = async (roleId: string, userIds: string[]): Promise<void> => {
  await httpClient.post(`${backendUrl}/user_roles/${roleId}/bulk_users`, {
    user_ids: userIds
  });
};

// Clone an existing role
export const cloneRole = async (roleId: string, data: CloneRoleData): Promise<Role> => {
  const response = await httpClient.post(`${backendUrl}/rbac/roles/${roleId}/clone`, data);

  return response.json();
};

// Exporta uno o más roles como archivo JSON descargable.
// Los permisos se exportan por nombre para que el archivo sea portable entre entornos.
export const exportRoles = async (body: ExportRolesBody): Promise<void> => {
  const response = await httpClient.fetch(`${backendUrl}/rbac/roles/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  await downloadBlobResponse(response, 'roles_export.json');
};

// Importa roles desde un archivo JSON exportado.
export const importRoles = async (
  file: File,
  params: ImportRolesQueryParams = {},
): Promise<ImportRolesData> => {
  const url = new URL(`${backendUrl}/rbac/roles/import`);
  if (params.on_conflict) url.searchParams.append('on_conflict', params.on_conflict);
  if (params.role_ids?.length) {
    url.searchParams.append('role_ids', params.role_ids.join(','));
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await httpClient.fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as ImportRolesResponse;
  return data.data;
};
