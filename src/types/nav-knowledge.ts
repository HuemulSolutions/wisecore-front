import type { RefObject } from "react"
import type { FileTreeRef } from "@/components/assets/content/assets-file-tree"

export interface NavKnowledgeContextValue {
  fileTreeRef: RefObject<FileTreeRef | null>
  handleCreateAsset: (folderId?: string) => void
  handleImportAsset: (folderId?: string) => void
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
  rootPage: number
  rootPageSize: number
  hasNextRootPage: boolean
  setRootPage: (page: number) => void
  setRootPageSize: (size: number) => void
  setHasNextRootPage: (hasNext: boolean) => void
  isRelationsMode: boolean
  setIsRelationsMode: (mode: boolean) => void
}
