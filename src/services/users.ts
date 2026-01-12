import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  last_name: string;
  status: 'active' | 'inactive' | 'pending';
  activated_at: string | null;
  external_id: string | null;
  auth_type_id: string;
  updated_at: string;
  created_at: string;
  birthdate: string | null;
  birth_day?: number;
  birth_month?: number;
  is_root_admin: boolean;
  photo_url: string | null;
  user_metadata: any | null;
  roles: UserRole[];
}

export interface UsersResponse {
  data: User[];
  total?: number;
  transaction_id: string;
  timestamp: string;
}

export interface UserOrganization {
  id: string;
  name: string;
  db_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserOrganizationsResponse {
  data: UserOrganization[];
  transaction_id: string;
  timestamp: string;
}

export interface AssignUserToOrganizationData {
  user_id: string;
}

export interface UpdateUserData {
  name?: string;
  last_name?: string;
  email?: string;
  birthdate?: string | null;
}

export interface CreateUserData {
  name: string;
  last_name: string;
  email: string;
  birth_day: number;
  birth_month: number;
  photo_file?: string;
}

// Get all users with roles
export const getUsers = async (organizationId?: string, page: number = 1, pageSize: number = 100): Promise<UsersResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // Add organization header if provided
  if (organizationId) {
    headers['X-Org-Id'] = organizationId;
  }

  const response = await httpClient.get(`${backendUrl}/user_roles/users_with_roles?${params}`, {
    headers
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User> => {
  const response = await httpClient.get(`${backendUrl}/users/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  
  const data = await response.json();
  return data.data;
};

// Approve user
export const approveUser = async (userId: string): Promise<void> => {
  const response = await httpClient.post(`${backendUrl}/users/${userId}/approve`);
  
  if (!response.ok) {
    throw new Error('Failed to approve user');
  }
};

// Reject user
export const rejectUser = async (userId: string): Promise<void> => {
  const response = await httpClient.post(`${backendUrl}/users/${userId}/reject`);
  
  if (!response.ok) {
    throw new Error('Failed to reject user');
  }
};

// Delete user
export const deleteUser = async (userId: string): Promise<void> => {
  const response = await httpClient.delete(`${backendUrl}/users/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
};

// Update user
export const updateUser = async (userId: string, data: UpdateUserData): Promise<User> => {
  const response = await httpClient.put(`${backendUrl}/users/${userId}`, data);
  
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  
  return response.json();
};

// Create new user
export const createUser = async (data: CreateUserData): Promise<User> => {
  const response = await httpClient.fetch(`${backendUrl}/users/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  
  return response.json();
};

// Get user organizations
export const getUserOrganizations = async (userId?: string): Promise<UserOrganizationsResponse> => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const url = `${backendUrl}/users/organizations?user_id=${userId}`;
    
  const response = await httpClient.get(url);
  
  if (!response.ok) {
    throw new Error('Failed to fetch user organizations');
  }
  
  return response.json();
};

// Assign user to organization
export const assignUserToOrganization = async (organizationId: string, data: AssignUserToOrganizationData): Promise<void> => {
  const response = await httpClient.post(`${backendUrl}/organizations/${organizationId}/users`, data);
  
  if (!response.ok) {
    throw new Error('Failed to assign user to organization');
  }
};

// Remove user from organization
export const removeUserFromOrganization = async (organizationId: string, userId: string): Promise<void> => {
  const response = await httpClient.delete(`${backendUrl}/organizations/${organizationId}/users/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to remove user from organization');
  }
};