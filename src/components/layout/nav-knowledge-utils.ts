import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
import type { LibraryContent, LibraryContentFolderType } from "@/types/folders"
import type { FileNode } from "@/types/assets"

// Helpers compartidos entre NavKnowledgeProvider (nav-knowledge-provider.tsx) y
// NavKnowledgeContent (nav-knowledge.tsx). Sin JSX a propósito, para no arrastrar
// dependencias de componentes a ninguno de los dos lados.

// Mensajes traducidos para los códigos de error de la matriz de permisos de carpetas.
// La UI ya oculta los botones correspondientes; esto es una defensa ante permisos que
// cambiaron a mitad de sesión (el mensaje del backend igual se muestra para el resto de códigos).
export function handleFolderActionError(error: unknown, t: (key: string) => string, fallbackMessage: string) {
  handleApiError(error, {
    fallbackMessage,
    onErrorCode: (code) => {
      const key: Record<string, string> = {
        FOLDER_NOT_DELETABLE: "knowledge.errors.folderNotDeletable",
        FOLDER_NOT_MOVABLE: "knowledge.errors.folderNotMovable",
        FOLDER_NOT_RENAMABLE: "knowledge.errors.folderNotRenamable",
        FOLDER_ADMINISTER_REQUIRED: "knowledge.errors.folderAdministerRequired",
        ORG_ADMIN_REQUIRED: "knowledge.errors.orgAdminRequired",
        MANAGE_GROUPS_REQUIRED: "knowledge.errors.manageGroupsRequired",
        FOLDER_NOT_GRANTABLE: "knowledge.errors.folderNotGrantable",
      }
      const messageKey = key[code]
      if (!messageKey) return false
      toast.error(t(messageKey))
      return true
    },
  })
}

// Carpeta grupal custom: creada en la raíz real (parent_folder_id: "root"), sin folder_type,
// hermana de Global/Forms/Grupal/Personal — distinta de las 5 carpetas fijas del sistema.
export function isRootGroupFolderNode(folderType: LibraryContentFolderType | null | undefined, parentFolderId: string | null | undefined): boolean {
  return !folderType && parentFolderId === null
}

export function buildFocusedTree(content: LibraryContent): FileNode[] {
  const { folders, assets } = content

  const folderMap = new Map<string, FileNode>()
  for (const f of folders) {
    folderMap.set(f.id, {
      id: f.id,
      name: f.name,
      type: 'folder',
      isExpanded: f.is_expanded,
      hasChildren: true,
      children: f.is_expanded ? [] : undefined,
      isSystem: f.folder_type != null && f.folder_type !== 'area',
      folder_type: f.folder_type,
      isRootGroup: isRootGroupFolderNode(f.folder_type, f.parent_folder_id),
      access_levels: f.access_levels,
    })
  }

  for (const f of folders) {
    if (!f.parent_folder_id) continue
    const parent = folderMap.get(f.parent_folder_id)
    if (parent?.isExpanded && parent.children) {
      parent.children.push(folderMap.get(f.id)!)
    }
  }

  // Assets de raíz, para devolverlos a nivel root
  const rootAssetNodes: FileNode[] = []
  for (const a of assets) {
    const assetNode: FileNode = {
      id: a.id,
      name: a.name,
      type: 'document' as const,
      document_type: a.document_type,
      access_levels: a.access_levels,
    }
    if (!a.folder_id) {
      rootAssetNodes.push(assetNode)
      continue
    }
    const parent = folderMap.get(a.folder_id)
    if (parent?.isExpanded && parent.children) {
      parent.children.push(assetNode)
    }
  }

  // Una carpeta expandida por el backend refleja lo que realmente llegó:
  // sin esto queda hasChildren:true con children:[] y refresh() la da por cargada.
  for (const node of folderMap.values()) {
    if (node.children) node.hasChildren = node.children.length > 0
  }

  const rootFolderNodes = folders
    .filter(f => f.parent_folder_id === null)
    .map(f => folderMap.get(f.id)!)
    .filter(Boolean)

  return [...rootFolderNodes, ...rootAssetNodes]
}
