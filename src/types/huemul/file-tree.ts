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
  /**
   * Qué nodos expandidos vale la pena reportar a `onExpandedFoldersChange`.
   * Por defecto: todos los expandibles. Existe para árboles donde no todo
   * nodo expandible es una carpeta real de la biblioteca (ej. el modo
   * "execution" del picker de assets, donde un documento se vuelve
   * expandible para listar sus versiones) — sin este filtro, ese id
   * contaminaría el set compartido de carpetas persistidas. Ver
   * ia context/arbol-biblioteca-activos-guide.md.
   */
  isNodePersistable?: (node: HuemulTreeNode) => boolean
  // Contenido adicional a mostrar después del nombre del nodo (ej. badge de versión).
  renderNodeSuffix?: (node: HuemulTreeNode) => ReactNode
  // Nodos de nivel raíz que deben verse como encabezado de sección (estilo Notion):
  // sin ícono de carpeta, texto en negrita, no arrastrables.
  isSectionHeader?: (node: HuemulTreeNode) => boolean
  // Al refrescar, recargar las carpetas que el usuario expandió a mano.
  // En false, el resultado de onRefresh/onLoadChildren es autoritativo:
  // solo queda expandido lo que venga marcado en esa respuesta.
  preserveExpandedOnRefresh?: boolean
  /**
   * Qué nodos puede arrastrar el usuario (mover por drag&drop).
   * Default: todos los arrastrables por las reglas visuales previas.
   *
   * NO bajar el default a `false`: los call-sites que no pasan esta prop
   * (external-systems, huemul-asset-tree-picker) perderían el drag en silencio.
   * Cada pantalla que exponga mover debe pasar su propio predicado — ver
   * ia context/rbac-audit-guide.md, punto 8 (gestos sin botón).
   */
  canDragNode?: (node: HuemulTreeNode) => boolean
  /**
   * Qué carpetas pueden RECIBIR un drop (destino). Distinto de `canDragNode`,
   * que decide qué nodo se puede tomar como origen.
   * Default: toda carpeta no deshabilitada acepta drop.
   *
   * NO bajar el default a `false`: los call-sites que no pasan esta prop
   * perderían el drop en silencio — misma nota que `canDragNode`.
   */
  canDropNode?: (node: HuemulTreeNode) => boolean
  /**
   * Se dispara cada vez que cambia el set de carpetas expandidas (expandir,
   * colapsar, o una carga que trae expansión ya resuelta desde el backend).
   * `folderIds` es el set expandido vigente (filtrado por `isNodePersistable`
   * si se pasó). `knownIds` es TODO nodo persistible que el árbol tiene
   * materializado en memoria en este momento (expandido o no, sin la poda por
   * colapso de `folderIds`) — le dice a quien persiste qué porción del universo
   * total puede dar por buena, para hacer un merge por cobertura en vez de un
   * reemplazo total (ver useTreeExpansionStorage.saveExpandedIds): un árbol que
   * solo ve una página, un subconjunto filtrado, o que carga vacío por un error
   * transitorio, no debe borrar carpetas expandidas de otras superficies o
   * páginas que no pasaron por acá. No se emite antes de la carga inicial
   * (`isInitialized`) para no pisar un estado persistido con un set vacío antes
   * de restaurarlo. El componente es agnóstico de storage — solo avisa; quien
   * lo use decide cómo (o si) persistir el valor.
   */
  onExpandedFoldersChange?: (folderIds: string[], context: { knownIds: string[] }) => void
}

export interface HuemulFileTreeRef {
  refresh: () => Promise<void>
}
