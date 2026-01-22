import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';

export interface Permission {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface PermissionWithStatus {
  id: string;
  name: string;
  description: string;
  assigned: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color?: string;
  permissions: Permission[];
  permission_num?: number;
  created_at: string;
  updated_at: string;
  users_count?: number;
}

export interface RolesResponse {
  data: Role[];
  total?: number;
  transaction_id: string;
  page: number
  page_size: number
  has_next: boolean
  timestamp: string;
}

export interface PermissionsResponse {
  data: Permission[];
  transaction_id: string;
  timestamp: string;
}

export interface PermissionsWithStatusResponse {
  data: {
    role: {
      id: string;
      name: string;
      description: string;
    };
    permissions: PermissionWithStatus[];
  };
  transaction_id: string;
  timestamp: string;
}

export interface UserRolesResponse {
  data: Role[];
  transaction_id: string;
  timestamp: string;
}

export interface RoleWithAssignment {
  id: string;
  name: string;
  description: string;
  color?: string;
  created_at: string;
  updated_at: string;
  has_role: boolean;
  permission_num?: number;
  users_count?: number;
}

export interface UserAllRolesResponse {
  data: RoleWithAssignment[];
  transaction_id: string;
  timestamp: string;
}

export interface UserWithAssignment {
  id: string;
  name: string;
  last_name: string;
  email: string;
  has_role: boolean;
  status: string;
  is_root_admin: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleWithAllUsersResponse {
  data: {
    role: Role;
    users: UserWithAssignment[];
  };
  transaction_id: string;
  timestamp: string;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
}

export interface AssignRolesData {
  role_ids: string[];
}

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
export const getRoles = async (page: number = 1, pageSize: number = 10): Promise<RolesResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });

  const response = await httpClient.get(`${backendUrl}/rbac/roles/with_perm_count?${params.toString()}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }
  
  return response.json();
};

// Create new role
export const createRole = async (data: CreateRoleData): Promise<Role> => {
  const response = await httpClient.post(`${backendUrl}/rbac/roles`, data, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create role');
  }
  
  return response.json();
};

// Get all permissions
export const getPermissions = async (): Promise<PermissionsResponse> => {
  const response = await httpClient.get(`${backendUrl}/rbac/permissions`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch permissions');
  }
  
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
  
  if (!response.ok) {
    throw new Error('Failed to fetch user roles');
  }
  
  return response.json();
};

// Get all roles with user assignment status
export const getUserAllRoles = async (userId: string): Promise<UserAllRolesResponse> => {
  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required');
  }
  
  const response = await httpClient.get(`${backendUrl}/user_roles/user_all_roles/${userId}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user all roles');
  }
  
  return response.json();
};

// Assign roles to user using bulk endpoint
export const assignRolesToUser = async (userId: string, data: AssignRolesData): Promise<void> => {
  const response = await httpClient.post(`${backendUrl}/user_roles/bulk_role_assign/${userId}`, data, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to assign roles to user');
  }
};

// Assign specific role to user (new endpoint)
export const assignRoleToUser = async (userId: string, roleIds: string[]): Promise<void> => {
  const response = await httpClient.fetch(`${backendUrl}/rbac/users/${userId}/roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({ role_ids: roleIds }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to assign role to user');
  }
};

// Get permissions for a specific role with assignment status
export const getRolePermissions = async (roleId: string): Promise<PermissionsWithStatusResponse> => {
  const response = await httpClient.get(`${backendUrl}/rbac/roles/${roleId}/permissions_with_status`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch role permissions');
  }
  
  const result = await response.json();
  return result;
};

// Update role permissions using PATCH endpoint
export const updateRole = async (roleId: string, data: { add_permissions: string[], remove_permissions: string[] }): Promise<Role> => {
  const response = await httpClient.patch(`${backendUrl}/rbac/roles/${roleId}`, data, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update role');
  }
  
  const result = await response.json();
  return result.data;
};

// Delete role (if endpoint exists)
export const deleteRole = async (roleId: string): Promise<void> => {
  const response = await httpClient.delete(`${backendUrl}/rbac/roles/${roleId}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete role');
  }
};

// Get role with all users and their assignment status
export const getRoleWithAllUsers = async (
  roleId: string,
  page?: number,
  pageSize?: number
): Promise<RoleWithAllUsersResponse> => {
  const params = new URLSearchParams();
  params.append('role_id', roleId);
  if (page) params.append('page', page.toString());
  if (pageSize) params.append('page_size', pageSize.toString());

  const response = await httpClient.get(`${backendUrl}/user_roles/role_with_all_users?${params.toString()}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch role with users');
  }
  
  return response.json();
};

// Assign users to a role
export const assignUsersToRole = async (roleId: string, userIds: string[]): Promise<void> => {
  const response = await httpClient.post(`${backendUrl}/user_roles/${roleId}/bulk_users`, {
    user_ids: userIds
  }, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to assign users to role');
  }
};