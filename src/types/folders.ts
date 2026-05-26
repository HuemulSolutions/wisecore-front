export interface LibraryContentAsset {
  id: string;
  name: string;
  document_type?: { id: string; name: string; color: string };
  folder_id: string | null;
  access_levels?: string[];
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
