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
}

export interface AssetTypePageActions {
  updateState: (updates: Partial<AssetTypePageState>) => void;
  closeDialog: (dialog: keyof AssetTypePageState) => void;
}
