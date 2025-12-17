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
  birthdate: string | null;
  is_root_admin: boolean;
  photo_url: string | null;
  user_metadata: any | null;
  created_at: string;
  roles?: UserRole[];
}

export interface UsersResponse {
  data: User[];
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
  birthdate: string;
}

// Get all users
export const getUsers = async (): Promise<UsersResponse> => {
  const response = await httpClient.get(`${backendUrl}/users/`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
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