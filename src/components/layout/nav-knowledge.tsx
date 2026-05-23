"use client"

import * as React from "react"
import { Plus, File, Folder, RefreshCw, Edit, Trash2, FileUp, Search, X, FolderUp } from "lucide-react"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type { MenuAction } from "@/types/menu-action"

import {
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileTree, type FileTreeRef } from "@/components/assets/content/assets-file-tree"
import type { FileNode } from "@/types/assets"
import { useLocation } from "react-router-dom"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { getLibraryContent, moveFolder, deleteFolder } from "@/services/folders"
import { moveDocument, deleteDocument } from "@/services/assets"
import { CreateAssetDialog } from "@/components/assets/dialogs/assets-create-dialog"
import { ImportAssetFromFileDialog } from "@/components/assets/dialogs/assets-import-from-file-dialog"
import { CreateFolderDialog } from "@/components/assets/dialogs/assets-create-folder-dialog"
import { DeleteFolderDialog } from "@/components/assets/dialogs/assets-delete-folder-dialog"
import { DeleteDocumentDialog } from "@/components/assets/dialogs/assets-delete-dialog"
import EditFolder from "@/components/assets/dialogs/assets-edit_folder"
import EditDocumentDialog from "@/components/assets/dialogs/assets-edit-dialog"
import { toast } from "sonner"
import { useOptionalEditingGuard } from "@/contexts/editing-guard-context"
import { handleApiError } from "@/lib/error-utils"
import { cn } from "@/lib/utils"

// Context para compartir el fileTreeRef entre header y content
const NavKnowledgeContext = React.createContext<{
  fileTreeRef: React.RefObject<FileTreeRef | null>
  handleCreateAsset: (folderId?: string) => void
  handleImportAsset: (folderId?: string) => void
  handleCreateFolder: (folderId?: string) => void
  handleDeleteFolder: (folderId: string, folderName: string) => void
  handleEditFolder: (folderId: string, currentName: string) => void
  handleDeleteDocument: (documentId: string, documentName: string) => void
  handleEditDocument: (documentId: string, currentName: string) => void
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
} | null>(null)

export function NavKnowledgeProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('layout')
  const navigate = useOrgNavigate()
  const fileTreeRef = useRef<FileTreeRef>(null)
  const [createAssetDialogOpen, setCreateAssetDialogOpen] = useState(false)
  const [renderCreateAssetDialog, setRenderCreateAssetDialog] = useState(false)
  const [importAssetDialogOpen, setImportAssetDialogOpen] = useState(false)
  const [renderImportAssetDialog, setRenderImportAssetDialog] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false)
  const [deleteDocumentDialogOpen, setDeleteDocumentDialogOpen] = useState(false)
  const [renderDeleteDocumentDialog, setRenderDeleteDocumentDialog] = useState(false)
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false)
  const [editDocumentDialogOpen, setEditDocumentDialogOpen] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null)
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null)
  const [folderToEdit, setFolderToEdit] = useState<{ id: string; name: string } | null>(null)
  const [documentToEdit, setDocumentToEdit] = useState<{ id: string; name: string } | null>(null)
  const [isDeletingDocument, setIsDeletingDocument] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [committedSearch, setCommittedSearch] = useState('')
  const [rootPage, setRootPage] = useState(1)
  const [rootPageSize, setRootPageSize] = useState(50)
  const [hasNextRootPage, setHasNextRootPage] = useState(false)
  const { selectedOrganizationId } = useOrganization()

  // Refs to keep callbacks stable across re-renders while accessing latest state
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate
  const documentToDeleteRef = useRef(documentToDelete)
  documentToDeleteRef.current = documentToDelete
  const selectedOrganizationIdRef = useRef(selectedOrganizationId)
  selectedOrganizationIdRef.current = selectedOrganizationId
  const isDeletingDocumentRef = useRef(isDeletingDocument)
  isDeletingDocumentRef.current = isDeletingDocument

  const handleCreateAsset = useCallback((folderId?: string) => {
    setCurrentFolderId(folderId)
    setRenderCreateAssetDialog(true)
    setCreateAssetDialogOpen(true)
  }, [])

  const handleImportAsset = useCallback((folderId?: string) => {
    setCurrentFolderId(folderId)
    setRenderImportAssetDialog(true)
    setImportAssetDialogOpen(true)
  }, [])

  const handleCreateFolder = useCallback((folderId?: string) => {
    setCurrentFolderId(folderId)
    setCreateFolderDialogOpen(true)
  }, [])

  const handleAssetCreated = useCallback((createdAsset?: { id: string; name: string; type: string }) => {
    console.log('📥 [NAV-KNOWLEDGE] handleAssetCreated called:', createdAsset)

    // Wait for the Radix exit animation (200 ms) to finish before
    // triggering navigation, which causes a large re-render cascade
    // through PermissionsProvider.  Navigating during the animation
    // produces a visible "flash" of the dialog portal.
    setTimeout(() => {
      console.log('🔄 [NAV-KNOWLEDGE] Refreshing file tree')
      fileTreeRef.current?.refresh()
      // Navigate to the newly created asset
      if (createdAsset) {
        console.log('🧭 [NAV-KNOWLEDGE] Navigating to asset:', `/asset/${createdAsset.id}`)
        navigateRef.current(`/asset/${createdAsset.id}`, {
          state: {
            selectedDocumentId: createdAsset.id,
            selectedDocumentName: createdAsset.name,
            selectedDocumentType: createdAsset.type,
            fromFileTree: true,
          }
        })
        console.log('✓ [NAV-KNOWLEDGE] Navigation initiated')
      }
    }, 300)
  }, []) // stable — uses ref for navigate

  const handleFolderCreated = useCallback(() => {
    fileTreeRef.current?.refresh()
  }, [])

  const handleDeleteFolder = useCallback((folderId: string, folderName: string) => {
    setFolderToDelete({ id: folderId, name: folderName })
    setDeleteFolderDialogOpen(true)
  }, [])

  const handleEditFolder = useCallback((folderId: string, currentName: string) => {
    setFolderToEdit({ id: folderId, name: currentName })
    setEditFolderDialogOpen(true)
  }, [])

  const handleDeleteDocument = useCallback((documentId: string, documentName: string) => {
    setDocumentToDelete({ id: documentId, name: documentName })
    setRenderDeleteDocumentDialog(true)
    setDeleteDocumentDialogOpen(true)
  }, [])

  const handleEditDocument = useCallback((documentId: string, currentName: string) => {
    setDocumentToEdit({ id: documentId, name: currentName })
    setEditDocumentDialogOpen(true)
  }, [])

  const handleFolderEdited = useCallback(() => {
    fileTreeRef.current?.refresh()
  }, [])

  const handleDocumentEdited = useCallback(() => {
    fileTreeRef.current?.refresh()
  }, [])

  const handleFolderDeleted = useCallback(async (deleteDocuments: boolean) => {
    if (!folderToDelete || !selectedOrganizationId) return

    try {
      await deleteFolder(folderToDelete.id, selectedOrganizationId, deleteDocuments)
      toast.success(t('knowledge.folderDeletedSuccess', { name: folderToDelete.name }))
      setDeleteFolderDialogOpen(false)
      setFolderToDelete(null)
      fileTreeRef.current?.refresh()
      if (deleteDocuments) {
        // Navigate away from any open asset since it may have been deleted
        setTimeout(() => {
          navigateRef.current('/asset', { replace: true })
        }, 300)
      }
    } catch (error) {
      handleApiError(error, { fallbackMessage: t('knowledge.folderDeleteError') })
      throw error
    }
  }, [folderToDelete, selectedOrganizationId, t])

  // Stable callback for DeleteDocumentDialog onOpenChange.
  // Uses ref to read isDeletingDocument without closing over it.
  const deleteDocumentDialogOnOpenChange = useCallback((open: boolean) => {
    if (!open && !isDeletingDocumentRef.current) {
      setDeleteDocumentDialogOpen(false)
      setDocumentToDelete(null)
      // Unmount dialog after exit animation
      setTimeout(() => setRenderDeleteDocumentDialog(false), 300)
    }
  }, [])

  const handleDocumentDeleted = useCallback(async () => {
    const doc = documentToDeleteRef.current
    const orgId = selectedOrganizationIdRef.current
    if (!doc || !orgId) return

    setIsDeletingDocument(true)
    try {
      await deleteDocument(doc.id, orgId)
      toast.success(t('knowledge.documentDeletedSuccess', { name: doc.name }))

      // ONLY close the dialog — keep isDeletingDocument=true so:
      //   1. ReusableAlertDialog's onOpenChange guard blocks any
      //      Radix-initiated close event during the exit animation.
      //   2. The dialog content (spinner / button label) doesn't
      //      change mid-animation, avoiding a visual "flash".
      setDeleteDocumentDialogOpen(false)

      // Defer ALL remaining state resets, navigation, and tree refresh
      // until after the Radix exit animation (200 ms) completes.
      // Navigating during the animation causes a large re-render
      // cascade (PermissionsProvider, Outlet swap) that interrupts
      // the portal and produces a visible flash.
      setTimeout(() => {
        setIsDeletingDocument(false)
        setDocumentToDelete(null)
        setRenderDeleteDocumentDialog(false)
        navigateRef.current('/asset', { replace: true })
        fileTreeRef.current?.refresh()
      }, 300)
    } catch (error) {
      handleApiError(error, { fallbackMessage: t('knowledge.documentDeleteError') })
      setIsDeletingDocument(false)
    }
  }, []) // stable — uses refs for mutable values

  const handleCreateAssetDialogChange = useCallback((open: boolean) => {
    console.log('🔄 [NAV-KNOWLEDGE] CreateAssetDialog onOpenChange:', open)
    setCreateAssetDialogOpen(open)
    if (!open) {
      // Unmount the dialog component AFTER the Radix exit animation
      // (200 ms) finishes. This guarantees that context-triggered
      // re-renders (e.g. PermissionsProvider, useOrganization) that
      // bypass React.memo cannot touch the portal and produce a flash.
      setTimeout(() => setRenderCreateAssetDialog(false), 300)
    }
  }, [])

  const handleImportAssetDialogChange = useCallback((open: boolean) => {
    setImportAssetDialogOpen(open)
    if (!open) {
      setTimeout(() => setRenderImportAssetDialog(false), 300)
    }
  }, [])

  const refreshFileTree = useCallback(() => {
    console.log('🔄 [NAV-KNOWLEDGE] Refreshing file tree')
    fileTreeRef.current?.refresh()
  }, [])

  return (
    <NavKnowledgeContext.Provider value={{ fileTreeRef, handleCreateAsset, handleImportAsset, handleCreateFolder, handleDeleteFolder, handleEditFolder, handleDeleteDocument, handleEditDocument, refreshFileTree, isSearchOpen, setIsSearchOpen, searchTerm, setSearchTerm, committedSearch, setCommittedSearch, rootPage, rootPageSize, hasNextRootPage, setRootPage, setRootPageSize, setHasNextRootPage }}>
      {children}
      {renderCreateAssetDialog && (
        <CreateAssetDialog
          open={createAssetDialogOpen}
          onOpenChange={handleCreateAssetDialogChange}
          folderId={currentFolderId}
          onAssetCreated={handleAssetCreated}
        />
      )}
      {renderImportAssetDialog && (
        <ImportAssetFromFileDialog
          open={importAssetDialogOpen}
          onOpenChange={handleImportAssetDialogChange}
          folderId={currentFolderId}
          onAssetCreated={handleAssetCreated}
        />
      )}
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        parentFolder={currentFolderId}
        onFolderCreated={handleFolderCreated}
      />
      <DeleteFolderDialog
        open={deleteFolderDialogOpen}
        onOpenChange={setDeleteFolderDialogOpen}
        folderName={folderToDelete?.name || ""}
        onConfirm={handleFolderDeleted}
      />
      <EditFolder
        open={editFolderDialogOpen}
        onOpenChange={setEditFolderDialogOpen}
        folderId={folderToEdit?.id || ""}
        currentName={folderToEdit?.name || ""}
        onFolderEdited={handleFolderEdited}
      />
      {renderDeleteDocumentDialog && (
        <DeleteDocumentDialog
          open={deleteDocumentDialogOpen}
          onOpenChange={deleteDocumentDialogOnOpenChange}
          documentName={documentToDelete?.name || ""}
          onConfirm={handleDocumentDeleted}
          isDeleting={isDeletingDocument}
        />
      )}
      <EditDocumentDialog
        open={editDocumentDialogOpen}
        onOpenChange={setEditDocumentDialogOpen}
        documentId={documentToEdit?.id || ""}
        currentName={documentToEdit?.name || ""}
        onUpdated={handleDocumentEdited}
      />
    </NavKnowledgeContext.Provider>
  )
}

function useNavKnowledge() {
  const context = React.useContext(NavKnowledgeContext)
  if (!context) {
    throw new Error('useNavKnowledge must be used within NavKnowledgeProvider')
  }
  return context
}

// Export hook for external use
export function useNavKnowledgeRefresh() {
  const context = React.useContext(NavKnowledgeContext)
  return context?.refreshFileTree || (() => {})
}

// Export hook for accessing dialog actions (create asset, create folder, etc.)
export function useNavKnowledgeActions() {
  const context = React.useContext(NavKnowledgeContext)
  return {
    handleCreateAsset: context?.handleCreateAsset || (() => {}),
    handleCreateFolder: context?.handleCreateFolder || (() => {}),
  }
}

// Export hook for accessing pagination state of the root file tree
export function useNavKnowledgePagination() {
  const context = React.useContext(NavKnowledgeContext)
  return {
    page: context?.rootPage ?? 1,
    pageSize: context?.rootPageSize ?? 50,
    hasNext: context?.hasNextRootPage ?? false,
    hasPrevious: (context?.rootPage ?? 1) > 1,
    setPage: context?.setRootPage ?? (() => {}),
    setPageSize: context?.setRootPageSize ?? (() => {}),
  }
}

export function NavKnowledgeHeader() {
  const { t } = useTranslation('layout')
  const { selectedOrganizationId } = useOrganization()
  const { fileTreeRef, handleCreateAsset, handleImportAsset, handleCreateFolder, isSearchOpen, setIsSearchOpen, searchTerm, setSearchTerm, setCommittedSearch } = useNavKnowledge()
  const { canCreate } = useUserPermissions()

  const canCreateAsset = canCreate('asset')
  const canCreateFolder = canCreate('folder')
  const hasAnyCreatePermission = canCreateAsset || canCreateFolder

  if (!selectedOrganizationId) {
    return null
  }

  const handleToggleSearch = () => {
    if (isSearchOpen) {
      setSearchTerm('')
      setCommittedSearch('')
    }
    setIsSearchOpen(!isSearchOpen)
  }

  return (
    <SidebarGroup className="py-0">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel className="py-0 text-xs">{t('knowledge.sectionTitle')}</SidebarGroupLabel>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:cursor-pointer"
            onClick={handleToggleSearch}
          >
            {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 hover:cursor-pointer"
            onClick={() => fileTreeRef.current?.refresh()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {hasAnyCreatePermission && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canCreateAsset && (
                  <DropdownMenuItem 
                    onSelect={() => {
                      setTimeout(() => handleCreateAsset(), 0)
                    }} 
                    className="hover:cursor-pointer"
                  >
                    <File className="mr-2 h-4 w-4" />
                    {t('knowledge.newAsset')}
                  </DropdownMenuItem>
                )}
                {canCreateAsset && (
                  <DropdownMenuItem
                    onSelect={() => {
                      setTimeout(() => handleImportAsset(), 0)
                    }}
                    className="hover:cursor-pointer"
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {t('knowledge.importAsset')}
                  </DropdownMenuItem>
                )}
                {canCreateFolder && (
                  <DropdownMenuItem 
                    onSelect={() => {
                      setTimeout(() => handleCreateFolder(), 0)
                    }} 
                    className="hover:cursor-pointer"
                  >
                    <Folder className="mr-2 h-4 w-4" />
                    {t('knowledge.newFolder')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {isSearchOpen && (
        <div className="px-2 pt-1 pb-1">
          <Input
            placeholder={t('knowledge.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setCommittedSearch(searchTerm) }}
            className="h-7 text-xs"
            autoFocus
          />
        </div>
      )}
    </SidebarGroup>
  )
}

export function NavKnowledgeContent() {
  const { t } = useTranslation('layout')
  const navigate = useOrgNavigate()
  const location = useLocation()
  const { selectedOrganizationId } = useOrganization()
  const { fileTreeRef, handleCreateAsset, handleImportAsset, handleCreateFolder, handleDeleteFolder, handleEditFolder, handleDeleteDocument, handleEditDocument, committedSearch, rootPage, rootPageSize, setHasNextRootPage } = useNavKnowledge()
  const [folderNames, setFolderNames] = useState<Map<string, string>>(new Map())
  const [documentNames, setDocumentNames] = useState<Map<string, string>>(new Map())
  const [nodeParentIds, setNodeParentIds] = useState<Map<string, string | null>>(new Map())
  const previousOrgId = React.useRef<string | null>(null)
  const { canCreate, canUpdate, canDelete } = useUserPermissions()
  const { guardedAction } = useOptionalEditingGuard()

  // Refs so handleLoadChildren callback stays stable while always reading latest values
  const rootPageRef = React.useRef(rootPage)
  rootPageRef.current = rootPage
  const rootPageSizeRef = React.useRef(rootPageSize)
  rootPageSizeRef.current = rootPageSize

  const [searchResults, setSearchResults] = React.useState<FileNode[]>([])
  const [searchMatchIds, setSearchMatchIds] = React.useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = React.useState(false)

  React.useEffect(() => {
    if (!committedSearch || !selectedOrganizationId) {
      setSearchResults([])
      setSearchMatchIds(new Set())
      return
    }
    let cancelled = false
    setIsSearching(true)
    getLibraryContent(selectedOrganizationId, undefined, 1, 1000, committedSearch)
      .then((data) => {
        if (!cancelled) {
          // Build a map of id -> FileNode for folders
          const nodeMap = new Map<string, FileNode>()
          ;(data?.folders ?? []).forEach((folder) => {
            nodeMap.set(folder.id, {
              id: folder.id,
              name: folder.name,
              type: 'folder',
              children: [],
              isExpanded: true,
            })
          })

          // Track which nodes are direct matches
          const matchIds = new Set<string>()
          ;(data?.folders ?? []).forEach((f) => { if (f.is_match) matchIds.add(f.id) })
          ;(data?.assets ?? []).forEach((a) => matchIds.add(a.id))

          // Attach assets to their parent folder (or mark as root)
          const rootAssets: FileNode[] = []
          ;(data?.assets ?? []).forEach((asset) => {
            const node: FileNode = {
              id: asset.id,
              name: asset.name,
              type: 'document',
              document_type: asset.document_type,
              access_levels: asset.access_levels,
            }
            const parentFolder = asset.folder_id ? nodeMap.get(asset.folder_id) : undefined
            if (parentFolder) {
              parentFolder.children!.push(node)
            } else {
              rootAssets.push(node)
            }
          })

          // Build folder hierarchy
          const roots: FileNode[] = []
          ;(data?.folders ?? []).forEach((folder) => {
            const node = nodeMap.get(folder.id)!
            const parentFolder = folder.parent_folder_id ? nodeMap.get(folder.parent_folder_id) : undefined
            if (parentFolder) {
              parentFolder.children!.push(node)
            } else {
              roots.push(node)
            }
          })

          setSearchMatchIds(matchIds)
          setSearchResults([...roots, ...rootAssets])
        }
      })
      .catch(() => {
        if (!cancelled) setSearchResults([])
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false)
      })
    return () => { cancelled = true }
  }, [committedSearch, selectedOrganizationId])

  // Extract active asset ID from URL (pattern: /:orgId/asset/:assetId)
  const activeAssetId = React.useMemo(() => {
    const match = location.pathname.match(/\/asset\/([^/]+)/)
    return match ? match[1] : null
  }, [location.pathname])

  // Refresh file tree only when organization actually changes (not on mount)
  React.useEffect(() => {
    // If previousOrgId is null, this is the initial mount - skip refresh
    // FileTree will handle its own initial load via loadInitialData
    if (previousOrgId.current === null) {
      previousOrgId.current = selectedOrganizationId
      return
    }
    
    // Only refresh if organization actually changed
    if (selectedOrganizationId && selectedOrganizationId !== previousOrgId.current) {
      previousOrgId.current = selectedOrganizationId
      fileTreeRef.current?.refresh()
    }
  }, [selectedOrganizationId, fileTreeRef])

  // Refresh root-level items when pagination changes
  const isFirstPaginationRender = React.useRef(true)
  React.useEffect(() => {
    if (isFirstPaginationRender.current) {
      isFirstPaginationRender.current = false
      return
    }
    fileTreeRef.current?.refresh()
  }, [rootPage, rootPageSize, fileTreeRef])

  const handleLoadChildren = useCallback(
    async (folderId: string | null): Promise<FileNode[]> => {
      if (!selectedOrganizationId) return []

      try {
        const isRoot = folderId === null
        const content = isRoot
          ? await getLibraryContent(selectedOrganizationId, undefined, rootPageRef.current, rootPageSizeRef.current)
          : await getLibraryContent(selectedOrganizationId, folderId)

        if (isRoot) {
          setHasNextRootPage(content.has_next)
        }

        const folderNodes: FileNode[] = (content.folders ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          type: 'folder',
          hasChildren: true,
        }))

        const assetNodes: FileNode[] = (content.assets ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          type: 'document',
          document_type: item.document_type,
          access_levels: item.access_levels,
        }))

        const nodes = [...folderNodes, ...assetNodes]

        // Store folder and document names for later use in delete dialog
        setFolderNames((prev) => {
          const newMap = new Map(prev)
          content.folders.forEach((item) => newMap.set(item.id, item.name))
          return newMap
        })

        setDocumentNames((prev) => {
          const newMap = new Map(prev)
          content.assets.forEach((item) => newMap.set(item.id, item.name))
          return newMap
        })

        // Track parent folder for each node so we can show "Move to Root" only for non-root nodes
        setNodeParentIds((prev) => {
          const newMap = new Map(prev)
          nodes.forEach((item) => newMap.set(item.id, folderId))
          return newMap
        })

        return nodes
      } catch (error) {
        console.error("Error loading folder content:", error)
        return []
      }
    },
    [selectedOrganizationId]
  )

  const handleFileClick = useCallback(
    async (node: FileNode) => {
      if (node.type === "document") {
        guardedAction(() => {
          // Navigate with full context to avoid redundant API calls
          // Pass all available information so assets.tsx doesn't need to reload
          navigate(`/asset/${node.id}`, {
            state: {
              selectedDocumentId: node.id,
              selectedDocumentName: node.name,
              selectedDocumentType: node.type,
              fromFileTree: true, // Flag to indicate navigation from FileTree
              documentType: node.document_type,
              accessLevels: node.access_levels,
            }
          })
        })
      }
    },
    [navigate, guardedAction]
  )

  const handleMoveFolder = useCallback(
    async (folderId: string, parentFolderId: string | null) => {
      if (!selectedOrganizationId) return

      try {
        await moveFolder(folderId, parentFolderId === null ? undefined : parentFolderId, selectedOrganizationId)
        const destination = parentFolderId === null
          ? t('knowledge.rootFolder')
          : (folderNames.get(parentFolderId) ?? parentFolderId)
        toast.success(t('knowledge.folderMovedSuccess', { destination }))
        fileTreeRef.current?.refresh()
      } catch (error) {
        handleApiError(error, { fallbackMessage: t('knowledge.folderMoveError') })
      }
    },
    [selectedOrganizationId, folderNames, t]
  )

  const handleMoveFile = useCallback(
    async (documentId: string, folderId: string | null) => {
      if (!selectedOrganizationId) return

      try {
        await moveDocument(documentId, folderId === null ? undefined : folderId, selectedOrganizationId)
        const destination = folderId === null
          ? t('knowledge.rootFolder')
          : (folderNames.get(folderId) ?? folderId)
        toast.success(t('knowledge.documentMovedSuccess', { destination }))
        fileTreeRef.current?.refresh()
      } catch (error) {
        handleApiError(error, { fallbackMessage: t('knowledge.documentMoveError') })
      }
    },
    [selectedOrganizationId, folderNames, t]
  )

  const menuActions: MenuAction[] = [
    {
      label: t('knowledge.newAsset'),
      icon: <File className="h-4 w-4" />,
      onClick: async (nodeId) => {
        handleCreateAsset(nodeId)
      },
      show: (node) => {
        if (node.type !== "folder") return false
        // Mostrar si tiene permiso global O access_level create
        return canCreate('asset') || node.access_levels?.includes('create') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.importAsset'),
      icon: <FileUp className="h-4 w-4" />,
      onClick: async (nodeId) => {
        handleImportAsset(nodeId)
      },
      show: (node) => {
        if (node.type !== "folder") return false
        return canCreate('asset') || node.access_levels?.includes('create') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.newFolder'),
      icon: <Folder className="h-4 w-4" />,
      onClick: async (nodeId) => {
        handleCreateFolder(nodeId)
      },
      show: (node) => {
        if (node.type !== "folder") return false
        // Mostrar si tiene permiso global O access_level create
        return canCreate('folder') || node.access_levels?.includes('create') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.editFolder'),
      icon: <Edit className="h-4 w-4" />,
      onClick: async (nodeId) => {
        const folderName = folderNames.get(nodeId) || ""
        handleEditFolder(nodeId, folderName)
      },
      show: (node) => {
        if (node.type !== "folder") return false
        // Mostrar si tiene permiso global O access_level edit
        return canUpdate('folder') || node.access_levels?.includes('edit') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.moveToRoot'),
      icon: <FolderUp className="h-4 w-4" />,
      onClick: async (nodeId) => {
        await handleMoveFolder(nodeId, null)
      },
      show: (node) => {
        if (node.type !== "folder") return false
        // Only show for folders that are NOT at root level
        if (nodeParentIds.get(node.id) === null) return false
        return canUpdate('folder') || node.access_levels?.includes('edit') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.deleteFolder'),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (nodeId) => {
        const folderName = folderNames.get(nodeId) || ""
        handleDeleteFolder(nodeId, folderName)
      },
      show: (node) => {
        if (node.type !== "folder") return false
        // Mostrar si tiene permiso global O access_level delete
        return canDelete('folder') || node.access_levels?.includes('delete') || false
      },
      variant: "destructive",
    },
    {
      label: t('knowledge.moveToRoot'),
      icon: <FolderUp className="h-4 w-4" />,
      onClick: async (nodeId) => {
        await handleMoveFile(nodeId, null)
      },
      show: (node) => {
        if (node.type !== "document") return false
        // Only show for documents that are NOT at root level
        if (nodeParentIds.get(node.id) === null) return false
        return canUpdate('asset') || node.access_levels?.includes('edit') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.editFile'),
      icon: <Edit className="h-4 w-4" />,
      onClick: async (nodeId) => {
        const documentName = documentNames.get(nodeId) || ""
        handleEditDocument(nodeId, documentName)
      },
      show: (node) => {
        if (node.type !== "document") return false
        // Mostrar si tiene permiso global O access_level edit
        return canUpdate('asset') || node.access_levels?.includes('edit') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.deleteFile'),
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (nodeId) => {
        const documentName = documentNames.get(nodeId) || ""
        handleDeleteDocument(nodeId, documentName)
      },
      show: (node) => {
        if (node.type !== "document") return false
        // Mostrar si tiene permiso global O access_level delete
        return canDelete('asset') || node.access_levels?.includes('delete') || false
      },
      variant: "destructive",
    },
  ]

  if (!selectedOrganizationId) {
    return null
  }

  const handleDelete = useCallback(
    async (nodeId: string, nodeType: "document" | "folder") => {
      if (nodeType === "folder") {
        const folderName = folderNames.get(nodeId) || "this folder"
        handleDeleteFolder(nodeId, folderName)
      } else if (nodeType === "document") {
        const documentName = documentNames.get(nodeId) || "this document"
        handleDeleteDocument(nodeId, documentName)
      }
    },
    [folderNames, documentNames, handleDeleteFolder, handleDeleteDocument]
  )

  return (
    <SidebarGroup>
      {committedSearch ? (
        isSearching ? (
          <div className="px-4 py-3 flex justify-center">
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="px-4 py-3 text-center text-xs text-muted-foreground">
            {t('knowledge.searchNoResults')}
          </div>
        ) : (
          <div className="space-y-0.5">
            {(function renderSearchNodes(nodes: FileNode[], level: number): React.ReactNode {
              return nodes.map((node, index) => {
                const isLastChild = index === nodes.length - 1
                const isFolder = node.type === 'folder'
                return (
                  <div key={node.id} className={cn("relative", level > 0 && "ml-4")}>
                    {level > 0 && (
                      <div
                        className="absolute w-px bg-border"
                        style={{ left: `${level * 12 - 14}px`, top: 0, height: isLastChild ? "1.25rem" : "100%" }}
                      />
                    )}
                    {level > 0 && (
                      <div
                        className="absolute top-5 w-3 h-px bg-border"
                        style={{ left: `${level * 12 - 14}px` }}
                      />
                    )}
                    <button
                      className={cn(
                        "group flex w-full items-center gap-1.5 py-0.5 rounded-md transition-colors text-sm hover:bg-accent hover:cursor-pointer text-left",
                        node.type === 'document' && activeAssetId === node.id && "bg-accent font-medium",
                        searchMatchIds.has(node.id) && "font-medium",
                      )}
                      style={{ paddingLeft: `${level * 12 + 6}px`, paddingRight: '8px' }}
                      onClick={() => node.type === 'document' && handleFileClick(node)}
                    >
                      {isFolder ? (
                        <Folder className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <File
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: node.document_type?.color ?? undefined }}
                        />
                      )}
                      <p className="text-sm truncate">{node.name}</p>
                    </button>
                    {node.children && node.children.length > 0 && renderSearchNodes(node.children, level + 1)}
                  </div>
                )
              })
            })(searchResults, 0)}
          </div>
        )
      ) : (
        <FileTree
          key={selectedOrganizationId}
          ref={fileTreeRef}
          onLoadChildren={handleLoadChildren}
          onFileClick={handleFileClick}
          onMoveFolder={handleMoveFolder}
          onMoveFile={handleMoveFile}
          onDelete={handleDelete}
          activeNodeId={activeAssetId}
          menuActions={menuActions}
          showDefaultActions={{ create: false, delete: false, share: false }}
          showCreateButtons={false}
          initialFolderId={null}
          showBorder={false}
          showRefreshButton={false}
          alwaysShowMenuActions={true}
          renderLeafIcon={(node) => {
            const color = (node as FileNode).document_type?.color
            return <File className="h-3.5 w-3.5 shrink-0" style={{ color: color ?? undefined }} />
          }}
        />
      )}
    </SidebarGroup>
  )
}
