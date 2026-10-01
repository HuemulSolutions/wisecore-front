import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
import { buildLibraryTree } from "@/lib/library-tree"
import type { LibraryContent, LibraryContentFolderType } from "@/types/folders"
import type { FileNode, FileTreePage } from "@/types/assets"

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

// Cursor de respaldo mientras el backend no devuelva `next_cursor`: "<página>:<tamaño>".
// Lleva el tamaño porque la primera carga raíz enriquecida (foco + expandidas) pide una
// página más grande que las siguientes, y la página 2 debe alinearse con ese tamaño.
export function encodePageCursor(page: number, pageSize: number): string {
  return `${page}:${pageSize}`
}

export interface ParsedTreeCursor {
  page: number
  pageSize: number
  /** Cursor opaco del backend (`next_cursor`), si el recibido no es del formato de respaldo. */
  opaque?: string
}

export function parsePageCursor(cursor: string | null | undefined, defaultPageSize: number): ParsedTreeCursor {
  if (!cursor) return { page: 1, pageSize: defaultPageSize }
  const match = /^(\d+):(\d+)$/.exec(cursor)
  if (match) return { page: Number(match[1]), pageSize: Number(match[2]) }
  return { page: 1, pageSize: defaultPageSize, opaque: cursor }
}

// Arma la respuesta paginada de un nivel del árbol. Prefiere el `next_cursor`/`total` del
// backend; sin ellos pagina por número de página (`has_next`) y no hay contador.
export function toTreePage(
  items: FileNode[],
  content: LibraryContent,
  page: number,
  pageSize: number,
): FileTreePage {
  const nextCursor =
    content.next_cursor !== undefined
      ? content.next_cursor
      : content.has_next
        ? encodePageCursor(page + 1, pageSize)
        : null
  return { items, total: content.total, hasMore: nextCursor !== null, nextCursor }
}

// Carpeta grupal custom: creada en la raíz real (parent_folder_id: "root"), sin folder_type,
// hermana de Global/Forms/Grupal/Personal — distinta de las 5 carpetas fijas del sistema.
export function isRootGroupFolderNode(folderType: LibraryContentFolderType | null | undefined, parentFolderId: string | null | undefined): boolean {
  return !folderType && parentFolderId === null
}

// Wrapper delgado sobre buildLibraryTree (src/lib/library-tree.ts): esta
// función solo aporta los mappers de presentación del sidebar de conocimiento
// (isSystem/folder_type/isRootGroup/access_levels/is_grantable). La mecánica
// de anidado + is_expanded + hasChildren vive en el helper genérico, reusada
// por los pickers de assets — ver ia context/arbol-biblioteca-activos-guide.md.
export function buildFocusedTree(content: LibraryContent): FileNode[] {
  return buildLibraryTree<FileNode>(content, {
    mapFolder: (f) => ({
      id: f.id,
      name: f.name,
      type: 'folder',
      isSystem: f.folder_type != null && f.folder_type !== 'area',
      folder_type: f.folder_type,
      isRootGroup: isRootGroupFolderNode(f.folder_type, f.parent_folder_id),
      access_levels: f.access_levels,
      is_grantable: f.is_grantable,
    }),
    mapAsset: (a) => ({
      id: a.id,
      name: a.name,
      type: 'document',
      document_type: a.document_type,
      access_levels: a.access_levels,
    }),
  })
}
