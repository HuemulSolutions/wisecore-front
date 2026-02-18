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

// Document type with access info for current user
export interface DocumentTypeWithInfo {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  role_count: number;
  access_level: string[];  // List of permissions: ['read', 'edit', 'create', 'delete', 'approve']
}

export interface DocumentTypesWithInfoResponse {
  data: DocumentTypeWithInfo[];
  transaction_id: string;
  page: number;
  page_size: number;
  has_next: boolean;
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
  
  return response.json();
};

// Get access level for specific role and document type
export const getAccessLevel = async (roleId: string, documentTypeId: string): Promise<AccessLevelResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/access-level?role_id=${roleId}&document_type_id=${documentTypeId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  return response.json();
};

// Get permissions for specific role
export const getRolePermissions = async (roleId: string): Promise<RoleDocumentTypesResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/roles/${roleId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  return response.json();
};

// Get permissions for specific document type
export const getDocumentTypePermissions = async (documentTypeId: string): Promise<RoleDocumentTypesResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/document-types/${documentTypeId}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  return response.json();
};

// Get all roles with access levels for a document type (combined endpoint)
export const getDocumentTypeRolesAccessLevels = async (documentTypeId: string): Promise<DocumentTypeRolesAccessLevelsResponse> => {
  const response = await httpClient.fetch(`${backendUrl}/role-doctype/document-types/${documentTypeId}/roles-access-levels`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  return response.json();
};

// Grant access (assign role permissions to document type)
export const grantAccess = async (data: RoleDocumentTypePermission): Promise<void> => {
  await httpClient.fetch(`${backendUrl}/role-doctype`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify(data),
  });
};

// Revoke access
export const revokeAccess = async (roleId: string, documentTypeId: string): Promise<void> => {
  await httpClient.fetch(`${backendUrl}/role-doctype?role_id=${roleId}&document_type_id=${documentTypeId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
};

// Update access level
export const updateAccess = async (roleDocTypeId: string, accessLevel: string): Promise<void> => {
  await httpClient.fetch(`${backendUrl}/role-doctype/${roleDocTypeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify({
      access_level: accessLevel,
    }),
  });
};

// Bulk grant access using the /api/v1/role-doctype/bulk endpoint
export const bulkGrantAccess = async (data: {
  document_type_id: string;
  roles_permissions: Array<{
    role_id: string;
    access_levels: string[];
  }>;
}): Promise<void> => {
  await httpClient.fetch(`${backendUrl}/role-doctype/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify(data),
  });
};

// Legacy function name for backward compatibility
export const assignRoleDocumentTypePermissions = grantAccess;

// Get all document types with access info for current user
// This endpoint handles both admin and regular users - backend filters based on token
export const getDocumentTypesWithInfo = async (
  page: number = 1,
  pageSize: number = 100
): Promise<DocumentTypesWithInfoResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });

  const response = await httpClient.fetch(
    `${backendUrl}/role-doctype/document_types/list_with_info?${params.toString()}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  return response.json();
};
