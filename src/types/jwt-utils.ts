export interface LoginTokenPayload {
  sub: string; // user id
  email: string;
  name: string;
  last_name: string;
  is_root_admin: boolean;
  exp: number;
}

export interface OrganizationTokenPayload {
  sub: string; // user id
  email: string;
  roles: string[];
  permissions: string[];
  is_root_admin: boolean;
  is_org_admin: boolean;
  exp: number;
}

export type PermissionAction = 'c' | 'r' | 'u' | 'd' | 'l';
export type PermissionResource =
  | 'organization'
  | 'user'
  | 'asset'
  | 'folder'
  | 'context'
  | 'asset_type'
  | 'docx_template'
  | 'template'
  | 'template_section'
  | 'section'
  | 'section_execution'
  | 'version'
  | 'llm_provider'
  | 'llm'
  | 'rbac'
  | 'diagram'
  | 'role_folder'
  | 'external_system'
  | 'external_functionality'
  | 'external_parameter'
  | 'external_secret'
  | 'lifecycle_external_publish_action'
  | 'lifecycle_external_review_action';

export type Permission = `${PermissionResource}:${PermissionAction}`;
