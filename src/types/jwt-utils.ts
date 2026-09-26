export interface LoginTokenPayload {
  sub: string; // user id
  email: string;
  name: string;
  last_name: string;
  is_root_admin: boolean;
  exp: number;
  /** Conexión con la que entró (INTERNAL en el login por código). docs/sso-frontend.md §2. */
  auth_type_id?: string;
  /** Organización elegida en el login (caso B o `select`); null si no aplica. */
  login_org_id?: string | null;
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
  | 'asset_type_relationship'
  | 'execution_relationship'
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
  | 'lifecycle_external_review_action'
  | 'lifecycle_elaboration_config'
  | 'token_usage'
  | 'notification'
  | 'custom_fields'
  | 'media'
  | 'canvas'
  | 'discussion'
  | 'tag';

export type Permission = `${PermissionResource}:${PermissionAction}` | 'folder:manage_groups';
