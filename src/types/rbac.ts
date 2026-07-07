export interface RbacPermission {
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
  permissions: RbacPermission[];
  permission_num?: number;
  created_at: string;
  updated_at: string;
  users_count?: number;
}

export interface RolesResponse {
  data: Role[];
  total?: number;
  transaction_id: string;
  page: number;
  page_size: number;
  has_next: boolean;
  timestamp: string;
}

export interface PermissionsResponse {
  data: RbacPermission[];
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
  page: number;
  page_size: number;
  has_next: boolean;
  total?: number;
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
  page: number;
  page_size: number;
  has_next: boolean;
  total?: number;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
}

export interface AssignRolesData {
  role_ids: string[];
}

export interface CloneRoleData {
  copy_users: boolean;
}

// ========================================
// Export / Import (migración por JSON)
// ========================================

export interface ExportRolesBody {
  role_ids: string[];
}

export interface ImportRolesQueryParams {
  on_conflict?: 'skip' | 'overwrite';
  role_ids?: string[];
}

export interface ImportRolesData {
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

export interface ImportRolesResponse {
  transaction_id: string;
  timestamp: string;
  data: ImportRolesData;
}
