// Miscellaneous component props for the assets module
import type React from 'react'
import type { LifecyclePermissions, FileNode } from './core'
import type { MenuAction } from '@/types/menu-action'
import type { HuemulFileTreeRef } from '@/huemul/components/huemul-file-tree'
import type { CustomFieldDocument } from '@/types/custom-fields'

// ----------------------------------------
// Access Control
// ----------------------------------------

export interface DocumentAccessControlProps {
  requiredAccess: string | string[]
  requireAll?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  /** Si se debe verificar también los permisos globales del usuario (asset:*, folder:*, etc.) */
  checkGlobalPermissions?: boolean
  /** Recurso para verificar permisos globales (ej: 'asset', 'folder', 'context') */
  resource?: string
  /** Lifecycle permissions from the document content response */
  lifecyclePermissions?: LifecyclePermissions
}

export interface DocumentActionButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  requiredAccess: string | string[]
  requireAll?: boolean
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Si se debe verificar también los permisos globales del usuario */
  checkGlobalPermissions?: boolean
  /** Recurso para verificar permisos globales (ej: 'asset', 'folder', 'context') */
  resource?: string
}

// ----------------------------------------
// Custom Fields List
// ----------------------------------------

export interface CustomFieldsListProps {
  customFields: CustomFieldDocument[]
  isLoading: boolean
  onAdd: () => void
  onEdit: (field: CustomFieldDocument) => void
  onEditContent: (field: CustomFieldDocument) => void
  onDelete: (field: CustomFieldDocument) => void
  onRefresh: () => void
  uploadingImageFieldId?: string | null
  isRefreshing?: boolean
  // Permisos separados por acción (defaults `false`, secure-by-default): un
  // único `canEdit` no distinguía crear de editar de borrar.
  canCreate?: boolean
  canUpdate?: boolean
  canDelete?: boolean
  /** Paginación del listado — si se omite onPageChange, no se muestra el footer de paginación. */
  page?: number
  pageSize?: number
  totalItems?: number
  hasNext?: boolean
  onPageChange?: (page: number) => void
}

// ----------------------------------------
// Empty Content
// ----------------------------------------

export interface AssetEmptyContentProps {
  currentFolderId: string | undefined
  onPreserveScroll?: () => void
}

// ----------------------------------------
// File Tree
// Note: renamed from FileTreeProps to AssetFileTreeProps to avoid collision
// with the BasicFileNode-based FileTreeProps exported from core.ts
// ----------------------------------------

export interface AssetFileTreeProps {
  onLoadChildren?: (folderId: string | null, node?: FileNode) => Promise<FileNode[]>
  onRefresh?: () => Promise<FileNode[]>
  /** documentTypeId and templateId are passed by custom create-file dialogs */
  onCreateFile?: (parentId: string | null, name: string, documentTypeId?: string, templateId?: string) => Promise<void>
  onCreateFolder?: (parentId: string | null, name: string) => Promise<void>
  onDelete?: (nodeId: string, nodeType: "document" | "folder") => Promise<void>
  onShare?: (nodeId: string) => Promise<void>
  onMoveFolder?: (folderId: string, parentFolderId: string | null) => Promise<void>
  onMoveFile?: (documentId: string, folderId: string | null) => Promise<void>
  onFileClick?: (node: FileNode) => void | Promise<void>
  activeNodeId?: string | null
  menuActions?: MenuAction[]
  showDefaultActions?: {
    create?: boolean
    delete?: boolean
    share?: boolean
  }
  customDialogs?: {
    createFile?: (parentId: string | null, onSuccess: () => void) => React.ReactNode
    createFolder?: (parentId: string | null, onSuccess: () => void) => React.ReactNode
    delete?: (nodeId: string, nodeType: "document" | "folder", onSuccess: () => void) => React.ReactNode
    share?: (nodeId: string, onSuccess: () => void) => React.ReactNode
  }
  showCreateButtons?: boolean
  initialFolderId?: string | null
  showBorder?: boolean
  showRefreshButton?: boolean
  minHeight?: string
  renderLeafIcon?: (node: FileNode) => React.ReactNode
  renderFolderIcon?: (node: FileNode, isExpanded: boolean) => React.ReactNode
  renderNodeClassName?: (node: FileNode) => string | undefined
  alwaysShowMenuActions?: boolean
  onNodeDragStart?: (e: React.DragEvent, node: FileNode) => void
  // Multi-selección opt-in (checkboxes), para modo exportación.
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (next: Set<string>) => void
  isNodeSelectable?: (node: FileNode) => boolean
  cascadeSelection?: boolean
  isNodeExpandable?: (node: FileNode) => boolean
  renderNodeSuffix?: (node: FileNode) => React.ReactNode
  // Al refrescar, recargar las carpetas que el usuario expandió a mano.
  // En false, el resultado de onRefresh/onLoadChildren es autoritativo:
  // solo queda expandido lo que venga marcado en esa respuesta.
  preserveExpandedOnRefresh?: boolean
  /**
   * Qué nodos puede arrastrar el usuario (mover por drag&drop).
   * Default: todos. Ver la nota en HuemulFileTreeProps.canDragNode.
   */
  canDragNode?: (node: FileNode) => boolean
}

export interface FileTreeRef extends HuemulFileTreeRef {}

// ----------------------------------------
// Section Execution
// ----------------------------------------

export interface SectionExecutionProps {
  sectionExecution: {
    id: string
    output: string
    section_id?: string
    /** Plate JSON nodes (stringified) – used to restore comment marks on load */
    plate_content?: string[]
    ai_suggestion_status?: 'pending' | 'completed' | 'failed' | null
    ai_suggestion_content?: string | null
    ai_suggestion_instruction?: string | null
    review_status?: 'editing' | 'reviewing' | 'finished' | null
    /** Valores del formulario (solo para secciones type="form") */
    form_fields?: import('../sections/core').FormFieldValue[]
  }
  /** payload solo lo envía el autoguardado de formularios (ver FormValuesSectionPayload) */
  onUpdate?: (payload?: import('../sections/core').FormValuesSectionPayload[]) => void
  readyToEdit: boolean
  sectionIndex?: number
  documentId?: string
  executionId?: string
  onExecutionStart?: (executionId?: string) => void
  executionStatus?: string
  onOpenExecuteSheet?: () => void
  executionMode?: 'single' | 'from' | 'full' | 'full-single'
  showExecutionFeedback?: boolean
  sectionType?: 'ai' | 'manual' | 'reference' | 'form' | null
  sectionName?: string
  /** Estado de la sección (ej. "pending"). Para type="form" decide responder vs solo lectura */
  status?: string
  canEditSections?: boolean
  onCreateSectionFromSelection?: (selectedMarkdown: string) => void
  onCopyLink?: () => void
  /** Definiciones de los form fields de la sección (solo type="form") */
  formFieldDefinitions?: import('../sections/core').SectionFormField[]
  /**
   * false si el depends_on propio de la sección no se cumple (con show_when_inactive:true
   * sigue visible pero inactiva). Ausente/true = sin restricción. Ver
   * "ia context/dependencias-condicionales-formularios-guide.md" §3.2.
   */
  sectionCanAnswer?: boolean
}
