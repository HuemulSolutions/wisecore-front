// Asset-related types extracted from components/assets

import type { LibraryContentFolderType } from "@/types/folders";

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
  fromFileTree?: boolean;
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
  type: "document" | "folder" | "execution";
  document_type?: DocumentType;
  access_levels?: string[];
  children?: FileNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  hasChildren?: boolean;
  disabled?: boolean;
  version?: string | null;
  status?: string;
  /** True for the fixed set of default root folders (Forms, Global, Grupal, Mis documentos, Sin carpeta). */
  isSystem?: boolean;
  folder_type?: LibraryContentFolderType | null;
  /** True for custom group folders created directly at the real root (folder_type: null, no parent). */
  isRootGroup?: boolean;
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
  content_hash: string | null;
  expiration_date: string | null;
  estimated_publication_date: string | null;
  review_date: string | null;
  audit_date: string | null;
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
  can_advance: boolean;
  can_rollback: boolean;
  will_advance_phase: boolean;
  version: string | null;
  version_required: boolean;
}

/**
 * Computed frontend permissions derived from lifecycle_permissions.
 */
export interface FrontendPermissions {
  canEditSections: boolean;
  canAccessSectionSheet: boolean;
  canExecuteAI: boolean;
  canReviewContent: boolean;
  canApproveContent: boolean;
  canPublishContent: boolean;
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
  is_public: boolean;
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
 * Campos de gating de generación IA. Solo vienen en GET /documents/{id} y
 * GET /documents/{id}/content — NO en el listado GET /documents/ (costo de
 * evaluar contexto por fila). `can_generate` ausente = backend viejo =>
 * tratar como `true` (fail-open). Ver "ia context/" del cambio de backend.
 */
export interface AssetGenerationGate {
  context_required?: boolean;
  can_generate?: boolean;
  cannot_generate_reason?: string | null;
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
    content_hash: string | null;
    template_id: string | null;
    template_name: string | null;
    template_instructions?: string | null;
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
    /** Real, immutable creator — distinct from created_by_user (the reassignable owner). */
    creator_id: string | null;
    /** Whether created_by (the owner) was ever reassigned away from the original creator. */
    owner_changed?: boolean;
  } & AssetGenerationGate;
  transaction_id: string;
  timestamp: string;
}

/**
 * Lightweight media URL refresh payload — `GET /documents/{id}/media_urls`.
 * `media_urls` maps mediaId -> freshly-signed download URL for every media
 * referenced in the document's current content. A media id referenced in the
 * document but omitted here means it is broken (deleted or no access) and
 * should be rendered as unavailable rather than retried.
 */
export interface DocumentMediaUrls {
  media_urls: Record<string, string>;
  ttl_seconds: number;
}

export interface DocumentMediaUrlsResponse {
  data: DocumentMediaUrls;
  transaction_id: string;
}

// ========================================
// Dialog Props Types
// ========================================

export interface CreateAssetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId?: string;
  onAssetCreated?: (asset: { id: string; name: string; type: "document" }) => void;
  /**
   * `asset:c` resuelto por el consumidor. Obligatoria a propósito (sin default):
   * el sheet muta `POST /documents/`, y un call-site que se olvide de pasarla
   * debe romper el build en vez de reabrir el hueco en silencio.
   */
  canCreate: boolean;
}

export interface CreateFolderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentFolder?: string;
  onFolderCreated?: (folder?: { id: string; name: string }) => void;
}

export interface DeleteDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onConfirm: (deleteDocuments: boolean) => Promise<void> | void;
}

export interface EditDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  currentName: string;
  currentDescription?: string;
  currentDocumentTypeId?: string;
  onUpdated: (newName: string, newDescription?: string) => void;
}

export interface EditFolderDialogProps {
  trigger?: React.ReactNode;
  folderId: string;
  currentName: string;
  onFolderEdited?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export interface CreateAssetRequest {
  name: string;
  description: string;
  internal_code?: string;
  document_type_id: string;
  template_id?: string;
  folder_id?: string;
  create_initial_version?: boolean;
  /**
   * Si se omite y hay `template_id`, hereda el valor del template. No
   * exponer este campo en el sheet de crear activo — mandarlo explícito
   * ahí rompería esa herencia. Se edita después desde "Editar Activo".
   */
  context_required?: boolean;
}

export interface CreateFolderRequest {
  name: string;
  organization_id: string;
  parent_folder_id?: string;
}

// ========================================
// Content Types
// ========================================

export interface ContentSection {
  id: string;
  section_id?: string;
  section_name?: string;
  section_type?: 'ai' | 'manual' | 'reference' | 'form';
  content: string;
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
  review_status?: 'editing' | 'reviewing' | 'finished' | null;
  form_fields?: import('../sections/core').FormFieldValue[];
  depends_on?: import('../sections/core').FieldDependencyCondition[] | null;
  show_when_inactive?: boolean;
  /**
   * Calculados por el backend a partir de depends_on/show_when_inactive propio de
   * la sección (ver "ia context/dependencias-condicionales-formularios-guide.md" §3.2).
   * Una sección con is_visible:false y show_when_inactive falsy ni siquiera llega en
   * /content — estos flags solo están presentes en las secciones que sí llegan.
   * Ausentes (sin depends_on) equivalen a true.
   */
  is_visible?: boolean;
  can_answer?: boolean;
  /**
   * @deprecated Superado por `can_edit`. Era una lectura simple de la fila de
   * `template_section_lifecycle_access` sin contemplar bypass de org admin ni el
   * fallback al permiso del documento cuando la sección no tiene filas propias.
   * Se mantiene tipado por si el backend lo sigue mandando, pero la app ya no lo
   * lee para decidir si el usuario puede editar — usar `can_edit`.
   */
  access?: import('../templates/section-lifecycle-access').TemplateSectionAccess;
  /**
   * Permiso de EDICIÓN de esta sección para el usuario actual (org admin,
   * resolución por rol/step, o fallback al permiso del documento si la sección
   * no tiene filas propias — ver src/types/templates/section-lifecycle-access.ts).
   * `null`/ausente = el flag no aplica a esta sección/documento; en ese caso el
   * permiso lo sigue dando el documento completo, sin degradar por esto.
   *
   * ⚠️ `GET /documents/{id}/content` (la fuente de este tipo) HOY NO manda este
   * campo — llega siempre `undefined`. La autoridad real es
   * `useDocumentSectionAccess` (src/hooks/useDocumentSectionAccess.ts), que lo
   * resuelve desde `GET /documents/{id}/sections`. Este campo se deja tipado por
   * si el backend lo suma más adelante a `/content`; hasta entonces no leer
   * `section.can_edit` directo — usar `resolveSectionCanEdit(section, access)`.
   */
  can_edit?: boolean | null;
}

/**
 * Sección tal como la devuelve `GET /documents/{id}/sections`: el backend ya
 * omite las secciones sin `view` para el usuario actual y resuelve `can_edit`
 * (org admin, rol/step, o fallback al documento). Ver
 * src/hooks/useDocumentSectionAccess.ts.
 */
export interface DocumentSectionAccessItem {
  id: string; // section_id (definición), no section_execution id
  name?: string;
  order?: number;
  can_edit?: boolean | null;
}

export interface LibraryContentProps {
  selectedFile: LibraryItem | null;
  breadcrumb: BreadcrumbItem[];
  selectedExecutionId: string | null;
  setSelectedExecutionId: (id: string | null) => void;
  selectedSectionId?: string | null;
  setSelectedSectionId?: (id: string | null) => void;
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

export interface FileSearchProps {
  items: FileNode[];
  onSelect?: (item: FileNode) => void;
  selectedId?: string;
  placeholder?: string;
}

export interface SearchResultItemProps {
  item: FileNode;
  level?: number;
  onSelect?: (item: FileNode) => void;
  selectedId?: string;
}

// ========================================
// Service Asset Types
// ========================================

export interface SyncedDocumentResult {
  document_id: string;
  document_name: string;
  sections_created: number;
  sections_updated: number;
  sections_deleted: number;
  custom_sections_preserved: number;
}

export interface SyncDocumentsFromTemplateResponse {
  template_id: string;
  template_name: string;
  synced_documents: SyncedDocumentResult[];
  total_documents_synced: number;
  errors: string[];
}

export interface SyncTemplateFromDocumentResponse {
  template_id: string;
  template_name: string;
  document_id: string;
  document_name: string;
  sections_created: number;
  sections_updated: number;
  sections_deleted: number;
}

export interface ImportDocumentFromFileParams {
  name: string;
  description?: string;
  internal_code?: string;
  document_type_id: string;
  section_separator?: 'h1' | 'h2' | 'h3';
  force_import?: boolean;
  folder_id?: string | null;
  file: File;
  organizationId: string;
}

export interface ImportDocumentFromUrlParams {
  url: string;
  name: string;
  description?: string;
  document_type_id: string;
  folder_id?: string | null;
  internal_code?: string;
  section_separator?: 'h1' | 'h2' | 'h3';
  force_import?: boolean;
  organizationId: string;
}

// Respuesta 202 de import-from-file / import-from-url (mismo shape en ambos)
export interface ImportDocumentAsyncResponse {
  document_id: string;
  execution_id: string;
  job_id: string;
  status: string;
  message: string;
  document_path: string;
}

// `detail` estructurado del 409 DUPLICATE_DOCUMENT_CONTENT (ver parseErrorDetail en error-utils)
export interface DuplicateDocumentDetail {
  document_id?: string;
  document_path?: string;
  document_name?: string;
}

// ========================================
// Export / Import de configuración (migración por JSON)
// Distinto de ImportDocumentFromFileParams, que importa DOCX/PDF y los convierte.
// ========================================

export interface ExportDocumentsBody {
  execution_ids: string[];
}

export interface ImportDocumentsConfigQueryParams {
  on_conflict?: 'skip' | 'overwrite';
  document_ids?: string[];
}

export interface ImportDocumentsConfigData {
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
}

export interface ImportDocumentsConfigResponse {
  transaction_id: string;
  timestamp: string;
  data: ImportDocumentsConfigData;
}

export interface PendingAiSuggestionSection {
  section_execution_id: string;
  section_id: string;
  section_name: string;
}

export interface PendingAiSuggestionExecution {
  execution_id: string;
  execution_name: string;
  pending_ai_suggestion_count: number;
  pending_ai_suggestion_sections: PendingAiSuggestionSection[];
}

export interface DocumentWithPendingChanges {
  id: string;
  name: string;
  internal_code: string | null;
  updated_at: string;
  updated_by: string | null;
  document_type: {
    id: string;
    name: string;
    color: string;
  };
  template_name: string;
  has_pending_ai_suggestion: boolean;
  pending_ai_suggestion_executions: PendingAiSuggestionExecution[];
}

export interface PendingChangesResponse {
  data: DocumentWithPendingChanges[];
  page: number;
  page_size: number;
  has_next: boolean;
}

/**
 * Conteo de activos por categoría del dashboard
 */
export interface DocumentStatistics {
  owned_count: number;
  draft_count: number;
  in_review_count: number;
  in_approval_count: number;
  approved_count: number;
  published_count: number;
  expiring_soon_count: number;
  unresolved_comments_count: number;
}

/**
 * Response de GET /documents/statistics
 */
export interface DocumentStatisticsResponse {
  data: DocumentStatistics;
  transaction_id: string;
  timestamp: string;
}
