import { httpClient } from '@/lib/http-client';
import { backendUrl } from '@/config';

export interface AccessLevelsResponse {
  data: string[];
  transaction_id: string;
  timestamp: string;
}

export interface RoleAccessLevel {
  level: string;
  assigned: boolean;
}

export interface RoleWithAccessLevels {
  role_id: string;
  role_name: string;
  access_levels: RoleAccessLevel[];
}

export interface DocumentTypeRolesAccessLevelsResponse {
  data: {
    document_type_id: string;
    document_type_name: string;
    access_levels: string[];
    roles: RoleWithAccessLevels[];
  };
  transaction_id: string;
  timestamp: string;
}

export interface RoleDocumentTypePermission {
  id?: string;
  role_id: string;
  document_type_id: string;
  access_level?: string;  // Single access level from API
  access_levels?: string[]; // Array for creating new permissions
  role_name?: string;
  document_type_name?: string;
  document_type_color?: string;
}

export interface AccessLevelResponse {
  data: {
    access_level: string;
    role_id: string;
    document_type_id: string;
  };
  transaction_id: string;
  timestamp: string;
}

export interface RoleDocumentTypesResponse {
  data: RoleDocumentTypePermission[];
  transaction_id: string;
  timestamp: string;
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

// Get all access levels
export const getAccessLevels = async (): Promise<AccessLevelsResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/access-levels`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch access levels');
  }
  
  return response.json();
};

// Get access level for specific role and document type
export const getAccessLevel = async (roleId: string, documentTypeId: string): Promise<AccessLevelResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/access-level?role_id=${roleId}&document_type_id=${documentTypeId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch access level');
  }
  
  return response.json();
};

// Get permissions for specific role
export const getRolePermissions = async (roleId: string): Promise<RoleDocumentTypesResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/roles/${roleId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch role permissions');
  }
  
  return response.json();
};

// Get permissions for specific document type
export const getDocumentTypePermissions = async (documentTypeId: string): Promise<RoleDocumentTypesResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/document-types/${documentTypeId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch asset type permissions');
  }
  
  return response.json();
};

// Get all roles with access levels for a document type (combined endpoint)
export const getDocumentTypeRolesAccessLevels = async (documentTypeId: string): Promise<DocumentTypeRolesAccessLevelsResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/document-types/${documentTypeId}/roles-access-levels`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch document type roles and access levels');
  }
  
  return response.json();
};

// Grant access (assign role permissions to document type)
export const grantAccess = async (data: RoleDocumentTypePermission): Promise<void> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to grant access');
  }
};

// Revoke access
export const revokeAccess = async (roleId: string, documentTypeId: string): Promise<void> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype?role_id=${roleId}&document_type_id=${documentTypeId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to revoke access');
  }
};

// Update access level
export const updateAccess = async (roleDocTypeId: string, accessLevel: string): Promise<void> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/${roleDocTypeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({
      access_level: accessLevel,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update access');
  }
};

// Bulk grant access using the /api/v1/role-doctype/bulk endpoint
export const bulkGrantAccess = async (data: {
  document_type_id: string;
  roles_permissions: Array<{
    role_id: string;
    access_levels: string[];
  }>;
}): Promise<void> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to grant bulk access');
  }
};

// Legacy function name for backward compatibility
export const assignRoleDocumentTypePermissions = grantAccess;
