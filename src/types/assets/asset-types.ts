// Asset Types - Types for the asset type management module

// ========================================
// Core Asset Type Types (from service)
// ========================================

export interface AssetType {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  assets_count?: number;
  color?: string | null;
}

export interface AssetTypesResponse {
  data: AssetType[];
  transaction_id: string;
  timestamp: string;
  has_next?: boolean;
}

export interface RoleAccess {
  role_id: string;
  role_name: string;
  access_levels: string[];
}

export interface AssetTypeWithRoles {
  document_type_id: string;
  document_type_name: string;
  document_type_color: string;
  document_type_created_date: string;
  document_count: number;
  roles: RoleAccess[];
}

export interface AssetTypesWithRolesResponse {
  data: AssetTypeWithRoles[];
  total?: number;
  page?: number;
  page_size?: number;
  has_next?: boolean;
  transaction_id: string;
  timestamp: string;
}

export interface CreateAssetTypeData {
  name: string;
  description: string;
}

export interface UpdateAssetTypeData {
  name?: string;
  description?: string;
}

export interface CloneAssetTypeData {
  name?: string | null;
  include_relationships?: boolean;
}

// ========================================
// Asset Type Page State & Actions
// ========================================

export interface AssetTypePageState {
  searchTerm: string;
  editingAssetType: AssetTypeWithRoles | null;
  showCreateDialog: boolean;
  deletingAssetType: AssetTypeWithRoles | null;
  cloningAssetType: AssetTypeWithRoles | null;
  rolePermissionsAssetType: AssetTypeWithRoles | null;
  lifecycleAssetType: AssetTypeWithRoles | null;
  viewRelationshipsAssetType: AssetTypeWithRoles | null;
  templatesAssetType: AssetTypeWithRoles | null;
  showExportDialog: boolean;
  showImportSheet: boolean;
}

export interface AssetTypePageActions {
  updateState: (updates: Partial<AssetTypePageState>) => void;
  closeDialog: (dialog: keyof AssetTypePageState) => void;
}

// ========================================
// Linked Templates (document_types/{id}/templates)
// ========================================

export interface LinkedTemplate {
  template_id: string;
  template_name: string;
  relation_name: string | null;
  can_create_express: boolean;
  require_name_on_express: boolean;
}

export interface DocumentTypeTemplatesResponse {
  data: LinkedTemplate[];
  transaction_id: string;
  timestamp: string;
}

// Body shared by the link (POST) and update (PATCH) endpoints
export interface DocumentTypeTemplateLinkBody {
  relation_name?: string | null;
  can_create_express?: boolean;
  require_name_on_express?: boolean;
}

export interface DocumentTypeTemplateLinkResponse {
  data: { message: string };
  transaction_id: string;
  timestamp: string;
}

// ========================================
// Export / Import
// ========================================

export interface ExportAssetTypesBody {
  document_type_ids: string[];
  include_lifecycle?: boolean;
  include_relationships?: boolean;
}

export interface ImportAssetTypesQueryParams {
  on_conflict?: 'skip' | 'overwrite';
  document_type_ids?: string[];
  include_lifecycle?: boolean;
  include_relationships?: boolean;
}

export interface ImportAssetTypesData {
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

export interface ImportAssetTypesResponse {
  transaction_id: string;
  timestamp: string;
  data: ImportAssetTypesData;
}
