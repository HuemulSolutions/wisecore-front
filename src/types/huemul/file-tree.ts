import type { ReactNode } from 'react'
import type { HuemulTreeNode, HuemulTreeMenuAction, HuemulFileTreeLabels } from './tree'

export interface HuemulFileTreeProps {
  onLoadChildren?: (folderId: string | null, node?: HuemulTreeNode) => Promise<HuemulTreeNode[]>
  onRefresh?: () => Promise<HuemulTreeNode[]>
  onCreateFile?: (parentId: string | null, name: string) => Promise<void>
  onCreateFolder?: (parentId: string | null, name: string) => Promise<void>
  onDelete?: (nodeId: string, nodeType: string) => Promise<void>
  onShare?: (nodeId: string) => Promise<void>
  onMoveFolder?: (folderId: string, parentFolderId: string | null) => Promise<void>
  onMoveFile?: (documentId: string, folderId: string | null) => Promise<void>
  onFileClick?: (node: HuemulTreeNode) => void | Promise<void>
  onFolderClick?: (node: HuemulTreeNode) => void | Promise<void>
  activeNodeId?: string | null
  menuActions?: HuemulTreeMenuAction[]
  showDefaultActions?: {
    create?: boolean
    delete?: boolean
    share?: boolean
  }
  customDialogs?: {
    createFile?: (parentId: string | null, onSuccess: () => void) => ReactNode
    createFolder?: (parentId: string | null, onSuccess: () => void) => ReactNode
    delete?: (nodeId: string, nodeType: string, onSuccess: () => void) => ReactNode
    share?: (nodeId: string, onSuccess: () => void) => ReactNode
  }
  folderType?: string
  renderLeafIcon?: (node: HuemulTreeNode) => ReactNode
  renderFolderIcon?: (node: HuemulTreeNode, isExpanded: boolean) => ReactNode
  renderNodeClassName?: (node: HuemulTreeNode) => string | undefined
  alwaysShowMenuActions?: boolean
  showCreateButtons?: boolean
  initialFolderId?: string | null
  showBorder?: boolean
  showRefreshButton?: boolean
  minHeight?: string
  labels?: HuemulFileTreeLabels
  onDragStart?: (e: React.DragEvent, node: HuemulTreeNode) => void
  // Multi-selección opt-in (checkboxes). Sin `selectable` el árbol se comporta
  // exactamente igual que antes (highlight de un solo nodo activo).
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (next: Set<string>) => void
  // Qué nodos pueden marcarse. Por defecto: solo hojas (type !== folderType).
  isNodeSelectable?: (node: HuemulTreeNode) => boolean
  // Selección tri-estado en cascada (carpetas seleccionan todos sus descendientes).
  // Opt-in: activa checkboxes en todos los nodos (no solo hojas) y cascada la selección.
  cascadeSelection?: boolean
  // Qué nodos pueden expandirse. Por defecto: solo carpetas (type === folderType).
  isNodeExpandable?: (node: HuemulTreeNode) => boolean
  // Contenido adicional a mostrar después del nombre del nodo (ej. badge de versión).
  renderNodeSuffix?: (node: HuemulTreeNode) => ReactNode
  // Nodos de nivel raíz que deben verse como encabezado de sección (estilo Notion):
  // sin ícono de carpeta, texto en negrita, no arrastrables.
  isSectionHeader?: (node: HuemulTreeNode) => boolean
  // Al refrescar, recargar las carpetas que el usuario expandió a mano.
  // En false, el resultado de onRefresh/onLoadChildren es autoritativo:
  // solo queda expandido lo que venga marcado en esa respuesta.
  preserveExpandedOnRefresh?: boolean
}

export interface HuemulFileTreeRef {
  refresh: () => Promise<void>
}
