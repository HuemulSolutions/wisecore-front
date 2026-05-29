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
  access_level?: string;
  access_levels?: string[];
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

export interface DocumentTypeWithInfo {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  role_count: number;
}

export interface DocumentTypesWithInfoResponse {
  data: DocumentTypeWithInfo[];
  transaction_id: string;
  page: number;
  page_size: number;
  has_next: boolean;
  timestamp: string;
}
