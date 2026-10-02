import type { RefObject } from "react"
import type { FileTreeRef } from "@/components/assets/content/assets-file-tree"
import type { CreateAssetContentMode } from "@/types/assets"

export interface NavKnowledgeContextValue {
  fileTreeRef: RefObject<FileTreeRef | null>
  pendingFocusAssetIdRef: RefObject<string | null>
  /** Id del nodo resaltado temporalmente en el árbol (ver revealAssetInTree). */
  revealedNodeId: string | null
  /** Expande el árbol hasta `assetId` y lo resalta unos segundos, sin navegar ni cerrar nada. */
  revealAssetInTree: (assetId: string) => void
  /** `mode` preselecciona el método de contenido del sheet (en blanco, plantilla o URL). */
  handleCreateAsset: (folderId?: string, mode?: CreateAssetContentMode) => void
  handleImportAsset: (folderId?: string) => void
  handleImportAssetFromExternal: (folderId?: string) => void
  handleImportConfig: () => void
  handleCreateFolder: (folderId?: string) => void
  handleCreateGroupFolder: () => void
  handleShareFolder: (folder: { id: string; name: string }) => void
  handleDeleteFolder: (folderId: string, folderName: string) => void
  handleEditFolder: (folderId: string, currentName: string) => void
  handleDeleteDocument: (documentId: string, documentName: string) => void
  handleEditDocument: (documentId: string, currentName: string) => void
  handleOpenAssetLifecycle: (documentId: string, documentName: string, documentTypeId: string | null) => void
  refreshFileTree: () => void
  isSearchOpen: boolean
  setIsSearchOpen: (open: boolean) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  committedSearch: string
  setCommittedSearch: (term: string) => void
}
