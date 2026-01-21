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
}

/**
 * Response from asset content API
 */
export interface AssetContentResponse {
  data: {
    document_id: string;
    execution_id: string;
    execution_name: string;
    document_type: DocumentType;
    executions: ExecutionInfo[];
    internal_code: string | null;
    access_levels: string[];
    content: ContentSection[];
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
  source_section_id?: string | null;
  source_execution_id?: string | null;
  source_mode?: string | null;
  status?: string;
  referenced_content?: string;
  referenced_document_id?: string | null;
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