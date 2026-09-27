import type { LibraryContent, LibraryContentAsset, LibraryContentFolder } from "@/types/folders"

// Mecánica compartida para construir un árbol desde una respuesta de
// getLibraryContent con `is_expanded` resuelto server-side (ver
// `expandedFolderIds`/`focusAssetId` en services/folders.ts y
// `ia context/arbol-biblioteca-activos-guide.md`). Extraído de lo que era
// `buildFocusedTree` en nav-knowledge-utils.ts para que cualquier árbol de la
// biblioteca (sidebar, pickers) construya su vista desde la misma respuesta
// sin reimplementar el anidado.
//
// Deliberadamente NO conoce FileNode ni HuemulTreeNode: cada consumidor pasa
// sus propios mappers de presentación (mapFolder/mapAsset) y solo aporta la
// mecánica de anidado + is_expanded + hasChildren.

export interface LibraryTreeNodeShape<TNode> {
  id: string
  children?: TNode[]
  isExpanded?: boolean
  hasChildren?: boolean
}

export interface BuildLibraryTreeOptions<TNode> {
  /**
   * Carpeta cuyo contenido queda en el nivel superior del resultado. `null`
   * (default) = raíz real, para la carga root enriquecida con
   * expandedFolderIds/focusAssetId. Un id concreto permite reusar el mismo
   * builder para una carga de hijos plana (sin is_expanded en juego, ya que
   * getLibraryContent(orgId, folderId) sin opciones no lo trae).
   */
  parentFolderId?: string | null
  mapFolder: (folder: LibraryContentFolder) => TNode
  /** Devolver `null` descarta el asset (ej. un picker de carpeta destino, sin hojas seleccionables). */
  mapAsset?: (asset: LibraryContentAsset) => TNode | null
}

export function buildLibraryTree<TNode extends LibraryTreeNodeShape<TNode>>(
  content: LibraryContent,
  { parentFolderId = null, mapFolder, mapAsset }: BuildLibraryTreeOptions<TNode>,
): TNode[] {
  const { folders, assets } = content

  // La escritura sobre node.isExpanded/children/hasChildren abajo necesita
  // ver TNode como algo que tiene esos campos — TNode ya lo garantiza vía el
  // bound del genérico, pero TS no lo infiere solo dentro del Map. Una única
  // aserción acá evita repetir `as unknown as` en cada línea.
  type Mutable = LibraryTreeNodeShape<TNode> & TNode

  const folderMap = new Map<string, Mutable>()
  for (const f of folders) {
    const node = mapFolder(f) as Mutable
    node.isExpanded = f.is_expanded
    node.children = f.is_expanded ? [] : undefined
    node.hasChildren = true
    folderMap.set(f.id, node)
  }

  for (const f of folders) {
    if (f.parent_folder_id === parentFolderId) continue
    if (!f.parent_folder_id) continue
    const parent = folderMap.get(f.parent_folder_id)
    if (parent?.isExpanded && parent.children) {
      parent.children.push(folderMap.get(f.id)!)
    }
  }

  const rootAssetNodes: TNode[] = []
  if (mapAsset) {
    for (const a of assets) {
      const assetNode = mapAsset(a)
      if (!assetNode) continue
      if (a.folder_id === parentFolderId) {
        rootAssetNodes.push(assetNode)
        continue
      }
      const parent = a.folder_id ? folderMap.get(a.folder_id) : undefined
      if (parent?.isExpanded && parent.children) {
        parent.children.push(assetNode)
      }
    }
  }

  // Una carpeta expandida por el backend refleja lo que realmente llegó: sin
  // esto queda hasChildren:true con children:[] y un refresh() la da por cargada.
  for (const node of folderMap.values()) {
    if (node.children) node.hasChildren = node.children.length > 0
  }

  const rootFolderNodes = folders
    .filter((f) => f.parent_folder_id === parentFolderId)
    .map((f) => folderMap.get(f.id)!)
    .filter(Boolean)

  return [...rootFolderNodes, ...rootAssetNodes]
}
