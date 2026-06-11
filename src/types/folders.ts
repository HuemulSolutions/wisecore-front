export interface AssetBreadcrumb {
  id: string;
  name: string;
  path: string;
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
}

export interface LibraryContentFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  path: string;
  is_match: boolean;
  is_context: boolean;
}

export interface LibraryContent {
  assets: LibraryContentAsset[];
  folders: LibraryContentFolder[];
  has_next: boolean;
}

export type LibraryContentLifecycleState =
  | 'draft'
  | 'in_review'
  | 'in_approval'
  | 'approved'
  | 'published'
  | 'archived';

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
