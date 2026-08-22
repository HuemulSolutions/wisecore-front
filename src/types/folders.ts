import type { ExecutionLifecycleState } from './execution';

export interface AssetBreadcrumb {
  id: string;
  name: string;
  path: string;
}

export interface LibraryContentAssetExecution {
  id: string;
  version_major: number | null;
  version_minor: number | null;
  version_patch: number | null;
  /** Nombre libre de la versión (ej. "Release Q3"), no el string armado desde major.minor.patch */
  version: string;
  status: LibraryContentLifecycleState;
  created_at: string;
}

export interface LibraryContentAsset {
  id: string;
  name: string;
  document_type?: { id: string; name: string; color: string };
  folder_id: string | null;
  access_levels?: string[];
  folder_name?: string;
  folder_path?: string;
  asset_path?: string;
  breadcrumbs?: AssetBreadcrumb[];
  has_pending_ai_suggestion?: boolean;
  has_unresolved_comments?: boolean;
  matching_execution_count?: number;
  matching_execution_ids?: string[];
  // Solo presentes cuando la request usa include_executions=true
  execution_count?: number;
  current_execution_id?: string;
  latest_execution_id?: string | null;
  executions?: LibraryContentAssetExecution[];
}

export type LibraryContentFolderType = 'personal' | 'global' | 'forms' | 'grupal' | 'area' | 'sin_carpeta';

export interface LibraryContentFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  path: string;
  is_match: boolean;
  is_context: boolean;
  is_expanded: boolean;
  folder_type?: LibraryContentFolderType | null;
  access_levels?: string[];
}

export interface LibraryContent {
  assets: LibraryContentAsset[];
  folders: LibraryContentFolder[];
  has_next: boolean;
}

export type LibraryContentLifecycleState = ExecutionLifecycleState;

export type LibraryContentOwnerScope = 'all' | 'me';

export interface GetLibraryContentFilters {
  has_pending_ai_suggestion?: boolean | null;
  lifecycle_state?: LibraryContentLifecycleState | null;
  owner_scope?: LibraryContentOwnerScope | null;
  has_unresolved_comments?: boolean | null;
  template_id?: string | null;
  document_type_id?: string | null;
  expiration_date?: string | null;
  estimated_publication_date?: string | null;
  review_date?: string | null;
  audit_date?: string | null;
}

export interface GetLibraryContentOptions {
  includeExecutions?: boolean;
  /** Modo lote: ignora folderId/search/filters/focusAssetId. Incompatible con ellos (400 del backend). */
  assetIds?: string[];
}
