import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';
import type { RbacPermission, PermissionWithStatus, Role, RolesResponse, PermissionsResponse, PermissionsWithStatusResponse, UserRolesResponse, RoleWithAssignment, UserAllRolesResponse, UserWithAssignment, RoleWithAllUsersResponse, CreateRoleData, AssignRolesData, CloneRoleData } from '@/types/rbac';

export type { RbacPermission as Permission, PermissionWithStatus, Role, RolesResponse, PermissionsResponse, PermissionsWithStatusResponse, UserRolesResponse, RoleWithAssignment, UserAllRolesResponse, UserWithAssignment, RoleWithAllUsersResponse, CreateRoleData, AssignRolesData, CloneRoleData };

// Get current organization ID from localStorage or context
const getOrganizationId = (): string | null => {
  return localStorage.getItem('selectedOrganizationId');
};

// Get headers with organization ID
const getHeaders = (): Record<string, string> => {
  const orgId = getOrganizationId();
  const headers: Record<string, string> = {};
  
  if (orgId) {
    headers['X-Org-Id'] = orgId;
  }
  
  return headers;
};

// Get all roles
export const getRoles = async (page: number = 1, pageSize: number = 10, search?: string): Promise<RolesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });

  if (search && search.trim()) {
    params.set('search', search.trim());
  }

  const response = await httpClient.get(`${backendUrl}/rbac/roles/with_perm_count?${params.toString()}`, {
    headers: getHeaders(),
  });
  
  return response.json();
};

// Create new role
export const createRole = async (data: CreateRoleData): Promise<Role> => {
  const response = await httpClient.post(`${backendUrl}/rbac/roles`, data, {
    headers: getHeaders(),
  });
  
  return response.json();
};

// Get all permissions
export const getPermissions = async (search?: string): Promise<PermissionsResponse> => {
  const url = new URL(`${backendUrl}/rbac/permissions`);
  if (search?.trim()) {
    url.searchParams.append('search', search.trim());
  }
  const response = await httpClient.get(url.toString(), {
    headers: getHeaders(),
  });

  return response.json();
};

// Get user roles
export const getUserRoles = async (userId: string): Promise<UserRolesResponse> => {
  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required');
  }
  
  const response = await httpClient.get(`${backendUrl}/rbac/users/${userId}/roles`, {
    headers: getHeaders(),
  });
  
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
  
  const response = await httpClient.get(`${backendUrl}/user_roles/user_all_roles/${userId}?${params.toString()}`, {
    headers: getHeaders(),
  });
  
  return response.json();
};

// Assign roles to user using bulk endpoint
export const assignRolesToUser = async (userId: string, data: AssignRolesData): Promise<void> => {
  await httpClient.post(`${backendUrl}/user_roles/bulk_role_assign/${userId}`, data, {
    headers: getHeaders(),
  });
};

// Assign specific role to user (new endpoint)
export const assignRoleToUser = async (userId: string, roleIds: string[]): Promise<void> => {
  await httpClient.fetch(`${backendUrl}/rbac/users/${userId}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
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
  const response = await httpClient.get(`${backendUrl}/rbac/roles/${roleId}/permissions_with_status?${params.toString()}`, {
    headers: getHeaders(),
  });
  
  const result = await response.json();
  return result;
};

// Update role permissions using PATCH endpoint
export const updateRole = async (roleId: string, data: { add_permissions: string[], remove_permissions: string[] }): Promise<Role> => {
  const response = await httpClient.patch(`${backendUrl}/rbac/roles/${roleId}`, data, {
    headers: getHeaders(),
  });
  
  const result = await response.json();
  return result.data;
};

// Delete role (if endpoint exists)
export const deleteRole = async (roleId: string): Promise<void> => {
  await httpClient.delete(`${backendUrl}/rbac/roles/${roleId}`, {
    headers: getHeaders(),
  });
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

  const response = await httpClient.get(`${backendUrl}/user_roles/role_with_all_users?${params.toString()}`, {
    headers: getHeaders(),
  });
  
  return response.json();
};

// Assign users to a role
export const assignUsersToRole = async (roleId: string, userIds: string[]): Promise<void> => {
  await httpClient.post(`${backendUrl}/user_roles/${roleId}/bulk_users`, {
    user_ids: userIds
  }, {
    headers: getHeaders(),
  });
};

// Clone an existing role
export const cloneRole = async (roleId: string, data: CloneRoleData): Promise<Role> => {
  const response = await httpClient.post(`${backendUrl}/rbac/roles/${roleId}/clone`, data, {
    headers: getHeaders(),
  });

  return response.json();
};
