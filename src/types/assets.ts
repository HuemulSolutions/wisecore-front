// Asset-related types extracted from components/assets

// ========================================
// Core Asset Types
// ========================================

/**
 * Represents a document type with basic information
 */
export interface DocumentType {
  id: string;
  name: string;
  color: string;
}

/**
 * Represents an item in the library (folder or document)
 */
export interface LibraryItem {
  id: string;
  name: string;
  type: "folder" | "document";
  document_type?: DocumentType;
  access_levels?: string[];
}

/**
 * Represents an item in the breadcrumb navigation
 */
export interface BreadcrumbItem {
  id: string;
  name: string;
}

/**
 * Navigation state passed between pages
 */
export interface LibraryNavigationState {
  selectedDocumentId?: string;
  selectedDocumentName?: string;
  selectedDocumentType?: "document" | "folder";
  restoreBreadcrumb?: boolean;
  breadcrumb?: BreadcrumbItem[];
  fromLibrary?: boolean;
  fromFileTree?: boolean; // Flag to indicate navigation from FileTree sidebar
  documentType?: DocumentType;
  accessLevels?: string[];
}

// ========================================
// File Tree Types
// ========================================

/**
 * Represents a node in the file tree (extended version for assets)
 */
export interface FileNode {
  id: string;
  name: string;
  type: "document" | "folder";
  document_type?: DocumentType;
  access_levels?: string[];
  children?: FileNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  hasChildren?: boolean;
  disabled?: boolean;
}

/**
 * Basic file node for generic file trees
 */
export interface BasicFileNode {
  id: string;
  name: string;
  type: "file" | "folder" | "document";
  children?: BasicFileNode[];
  icon?: string;
  isLoading?: boolean;
  hasMore?: boolean;
  document_type?: DocumentType;
  access_levels?: string[];
}

/**
 * Props for file tree components
 */
export interface FileTreeProps {
  items: BasicFileNode[];
  onDrop?: (draggedItem: BasicFileNode, targetFolder: BasicFileNode) => void;
  onSelect?: (item: BasicFileNode) => void;
  onDoubleClick?: (item: BasicFileNode) => void;
  selectedId?: string;
  onLoadChildren?: (folderId: string) => Promise<BasicFileNode[]>;
}

/**
 * Response from folder content API
 */
export interface FolderContentResponse {
  data: {
    folder_name: string;
    parent_id: string | null;
    content: Array<{
      id: string;
      name: string;
      type: "document" | "folder";
      document_type?: DocumentType;
      access_levels?: string[];
    }>;
  };
  transaction_id: string;
  timestamp: string;
}

/**
 * User information
 */
export interface UserInfo {
  id: string;
  name: string;
  last_name: string;
  email: string;
}

/**
 * Execution information
 */
export interface ExecutionInfo {
  id: string;
  name: string;
  status: string;
  status_message: string;
  created_at: string;
  version: string | null;
  version_major: number | null;
  version_minor: number | null;
  version_patch: number | null;
}

/**
 * Lifecycle permissions for a document
 */
export interface LifecyclePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  review: boolean;
  approve: boolean;
  publish: boolean;
  archive: boolean;
}

/**
 * Lifecycle status of a document
 */
export interface LifecycleStatus {
  state: string;
  stage: string;
  current_group: string | null;
  current_group_order: number;
  current_step_id: string | null;
  can_check: boolean;
  will_advance_phase: boolean;
  version: string | null;
  version_required: boolean;
}

/**
 * Computed frontend permissions derived from lifecycle_permissions.
 * These are NOT returned by the backend — they are calculated on the frontend via
 * computeFrontendPermissions() to express high-level UI capabilities.
 * Permissions are based purely on what the user has access to, NOT on the current stage.
 */
export interface FrontendPermissions {
  /** User can add/edit/delete sections (has create|edit permission) */
  canEditSections: boolean;
  /** User can open the section sheet in read-only mode (has create|edit|review|approve|publish permission) */
  canAccessSectionSheet: boolean;
  /** User can trigger AI execution on the document (has create|edit permission) */
  canExecuteAI: boolean;
  /** User can perform review actions (has review permission) */
  canReviewContent: boolean;
  /** User can approve/disapprove executions (has approve permission) */
  canApproveContent: boolean;
  /** User can publish the document (has publish permission) */
  canPublishContent: boolean;
  /** User can archive the document (has archive permission) */
  canArchiveContent: boolean;
}

/**
 * A comment embedded in the latest_discussion payload of the content response
 */
export interface LatestDiscussionComment {
  id: string;
  discussion_id: string;
  content_rich: string;
  user_id: string;
  is_edited: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

/**
 * Discussion object returned inline in the document content response
 */
export interface LatestDiscussion {
  id: string;
  document_id: string;
  section_execution_id: string | null;
  organization_id: string;
  document_content: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  comments: LatestDiscussionComment[];
}

/**
 * Response from asset content API
 */
export interface AssetContentResponse {
  data: {
    document_id: string;
    document_name: string;
    description?: string;
    execution_id: string;
    execution_name: string;
    template_id: string | null;
    template_name: string | null;
    document_type: DocumentType;
    executions: ExecutionInfo[];
    internal_code: string | null;
    access_level: string;
    access_levels: string[];
    lifecycle_permissions?: LifecyclePermissions;
    lifecycle_status?: LifecycleStatus;
    content: ContentSection[];
    latest_discussion?: LatestDiscussion | null;
    created_by_user: UserInfo | null;
    updated_by_user: UserInfo | null;
  };
  transaction_id: string;
  timestamp: string;
}

// ========================================
// Dialog Props Types
// ========================================

/**
 * Props for create asset dialog
 */
export interface CreateAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string;
  onAssetCreated?: (asset: { id: string; name: string; type: "document" }) => void;
}

/**
 * Props for create folder dialog
 */
export interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentFolder?: string;
  onFolderCreated?: () => void;
}

/**
 * Props for delete document dialog
 */
export interface DeleteDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

/**
 * Props for delete folder dialog
 */
export interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onConfirm: () => Promise<void> | void;
}

/**
 * Props for edit document dialog
 */
export interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  currentName: string;
  currentDescription?: string;
  currentDocumentTypeId?: string;
  onUpdated: (newName: string, newDescription?: string) => void;
}

/**
 * Props for edit folder dialog
 */
export interface EditFolderDialogProps {
  trigger?: React.ReactNode;
  folderId: string;
  currentName: string;
  onFolderEdited?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Props for edit custom field document dialog
 */
export interface EditCustomFieldDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  fieldId: string;
  currentValue: string;
  fieldName: string;
  onUpdated?: () => void;
}

// ========================================
// API Request Types
// ========================================

/**
 * Request payload for creating an asset
 */
export interface CreateAssetRequest {
  name: string;
  description: string;
  internal_code?: string;
  document_type_id: string;
  template_id?: string;
  folder_id?: string;
  create_initial_version?: boolean;
}

/**
 * Request payload for creating a folder
 */
export interface CreateFolderRequest {
  name: string;
  organization_id: string;
  parent_folder_id?: string;
}

// ========================================
// Content Types
// ========================================

/**
 * Interface for content sections
 */
export interface ContentSection {
  id: string;
  section_id?: string;
  section_name?: string;
  section_type?: 'ai' | 'manual' | 'reference';
  content: string;
  /** Plate JSON nodes (stringified). When present, used to restore the editor
   *  with comment marks and other rich-text metadata that markdown cannot carry. */
  plate_content?: string[];
  source_section_id?: string | null;
  source_execution_id?: string | null;
  source_mode?: string | null;
  status?: string;
  referenced_content?: string;
  referenced_document_id?: string | null;
  ai_suggestion_status?: 'pending' | 'completed' | 'failed' | null;
  ai_suggestion_content?: string | null;
  ai_suggestion_instruction?: string | null;
  ai_suggestion_error?: string | null;
}

/**
 * Props for library content component
 */
export interface LibraryContentProps {
  selectedFile: LibraryItem | null;
  breadcrumb: BreadcrumbItem[];
  selectedExecutionId: string | null;
  setSelectedExecutionId: (id: string | null) => void;
  setSelectedFile: (file: LibraryItem | null) => void;
  onRefresh: () => void;
  currentFolderId?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onPreserveScroll?: () => void;
}

// ========================================
// File Tree Component Props
// ========================================

/**
 * Props for file tree with search and context
 */
export interface FileTreeWithSearchAndContextProps {
  onLoadChildren?: (folderId: string | null) => Promise<FileNode[]>;
  onCreateFile?: (parentId: string | null, name: string, documentTypeId?: string, templateId?: string) => Promise<void>;
  onCreateFolder?: (parentId: string | null, name: string) => Promise<void>;
  onDelete?: (nodeId: string, nodeType: "document" | "folder") => Promise<void>;
  onShare?: (nodeId: string) => Promise<void>;
  onMoveFolder?: (folderId: string, parentFolderId: string | null) => Promise<void>;
  onSelectItem?: (item: FileNode) => void;
  onDoubleClickItem?: (item: FileNode) => void;
  selectedItemId?: string;
  className?: string;
  searchPlaceholder?: string;
}

/**
 * Props for file tree with context menu
 */
export interface FileTreeWithContextProps {
  items: FileNode[];
  onLoadChildren?: (folderId: string | null) => Promise<FileNode[]>;
  onCreateFile?: (parentId: string | null, name: string, documentTypeId?: string, templateId?: string) => Promise<void>;
  onCreateFolder?: (parentId: string | null, name: string) => Promise<void>;
  onDelete?: (nodeId: string, nodeType: "document" | "folder") => Promise<void>;
  onShare?: (nodeId: string) => Promise<void>;
  onMoveFolder?: (folderId: string, parentFolderId: string | null) => Promise<void>;
  onSelectItem?: (item: FileNode) => void;
  onDoubleClickItem?: (item: FileNode) => void;
  selectedItemId?: string;
  className?: string;
}

/**
 * Props for individual file tree item (basic version)
 */
export interface FileTreeItemProps {
  item: BasicFileNode;
  level: number;
  onDrop: (draggedItem: BasicFileNode, targetFolder: BasicFileNode) => void;
  onSelect: (item: BasicFileNode) => void;
  onDoubleClick?: (item: BasicFileNode) => void;
  selectedId?: string;
  onLoadChildren?: (folderId: string) => Promise<BasicFileNode[]>;
  onChildrenLoaded?: (folderId: string, children: BasicFileNode[]) => void;
}

/**
 * Props for file tree item with context menu
 */
export interface FileTreeItemWithContextProps {
  item: FileNode;
  onToggle?: (item: FileNode) => void;
  onSelect?: (item: FileNode) => void;
  onDoubleClick?: (item: FileNode) => void;
  level?: number;
  isSelected?: boolean;
  onLoadChildren?: (folderId: string) => Promise<FileNode[]>;
  onCreateFile?: (parentId: string | null, name: string, documentTypeId?: string, templateId?: string) => Promise<void>;
  onCreateFolder?: (parentId: string | null, name: string) => Promise<void>;
  onDelete?: (nodeId: string, nodeType: "document" | "folder") => Promise<void>;
  onShare?: (nodeId: string) => Promise<void>;
  onMoveFolder?: (folderId: string, parentFolderId: string | null) => Promise<void>;
}

/**
 * Props for file search component
 */
export interface FileSearchProps {
  items: FileNode[];
  onSelect?: (item: FileNode) => void;
  selectedId?: string;
  placeholder?: string;
}

/**
 * Props for search result item component (specific to file-search)
 */
export interface SearchResultItemProps {
  item: FileNode;
  level?: number;
  onSelect?: (item: FileNode) => void;
  selectedId?: string;
}