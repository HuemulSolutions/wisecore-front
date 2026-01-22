// Asset Types - Types extracted from components/asset-types and services/asset-types

// ========================================
// Core Asset Type Types (from service)
// ========================================

/**
 * Represents a basic asset type
 */
export interface AssetType {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  assets_count?: number;
}

/**
 * Response from asset types API
 */
export interface AssetTypesResponse {
  data: AssetType[];
  transaction_id: string;
  timestamp: string;
}

/**
 * Role access information for an asset type
 */
export interface RoleAccess {
  role_id: string;
  role_name: string;
  access_levels: string[];
}

/**
 * Asset type with associated role information
 */
export interface AssetTypeWithRoles {
  document_type_id: string;
  document_type_name: string;
  document_type_color: string;
  document_type_created_date: string;
  document_count: number;
  roles: RoleAccess[];
}

/**
 * Response from asset types with roles API
 */
export interface AssetTypesWithRolesResponse {
  data: AssetTypeWithRoles[];
  total?: number;
  transaction_id: string;
  timestamp: string;
}

/**
 * Data for creating a new asset type
 */
export interface CreateAssetTypeData {
  name: string;
  description: string;
}

/**
 * Data for updating an existing asset type
 */
export interface UpdateAssetTypeData {
  name?: string;
  description?: string;
}

// ========================================
// Asset Type Page State & Actions
// ========================================

/**
 * State for the asset type page
 */
export interface AssetTypePageState {
  searchTerm: string;
  selectedAssetTypes: Set<string>;
  editingAssetType: AssetTypeWithRoles | null;
  showCreateDialog: boolean;
  deletingAssetType: AssetTypeWithRoles | null;
  rolePermissionsAssetType: AssetTypeWithRoles | null;
}

/**
 * Actions available on the asset type page
 */
export interface AssetTypePageActions {
  updateState: (updates: Partial<AssetTypePageState>) => void;
  closeDialog: (dialog: keyof AssetTypePageState) => void;
  handleAssetTypeSelection: (assetTypeId: string) => void;
  handleSelectAll: () => void;
}

// ========================================
// Asset Type Component Props
// ========================================

/**
 * Props for the asset type page header component
 */
export interface AssetTypePageHeaderProps {
  assetTypeCount: number;
  onCreateAssetType: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  hasError?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

/**
 * Props for the asset type table component
 */
export interface AssetTypeTableProps {
  assetTypes: AssetTypeWithRoles[];
  selectedAssetTypes: Set<string>;
  onAssetTypeSelection: (assetTypeId: string) => void;
  onSelectAll: () => void;
  onEditAssetType: (assetType: AssetTypeWithRoles) => void;
  onManagePermissions: (assetType: AssetTypeWithRoles) => void;
  onDeleteAssetType: (assetType: AssetTypeWithRoles) => void;
  assetTypeMutations: {
    createAssetType: any; // UseMutationResult from @tanstack/react-query
    updateAssetType: any;
    deleteAssetType: any;
  };
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  showFooterStats?: boolean;
}

/**
 * Props for the asset type page dialogs component
 */
export interface AssetTypePageDialogsProps {
  state: AssetTypePageState;
  onCloseDialog: (dialog: keyof AssetTypePageState) => void;
  onUpdateState: (updates: Partial<AssetTypePageState>) => void;
  assetTypeMutations: {
    deleteAssetType: any; // UseMutationResult from @tanstack/react-query
  };
}
