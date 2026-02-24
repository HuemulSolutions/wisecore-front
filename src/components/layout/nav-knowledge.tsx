"use client"

import * as React from "react"
import { Plus, File, Folder, RefreshCw, Edit, Trash2 } from "lucide-react"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { useCallback, useRef, useState } from "react"
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
import { FileTree, type FileTreeRef } from "@/components/assets/content/assets-file-tree"
import type { FileNode } from "@/types/assets"
import { useLocation } from "react-router-dom"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { getLibraryContent, moveFolder, deleteFolder } from "@/services/folders"
import { moveDocument, deleteDocument } from "@/services/assets"
import { CreateAssetDialog } from "@/components/assets/dialogs/assets-create-dialog"
import { CreateFolderDialog } from "@/components/assets/dialogs/assets-create-folder-dialog"
import { DeleteFolderDialog } from "@/components/assets/dialogs/assets-delete-folder-dialog"
import { DeleteDocumentDialog } from "@/components/assets/dialogs/assets-delete-dialog"
import EditFolder from "@/components/assets/dialogs/assets-edit_folder"
import EditDocumentDialog from "@/components/assets/dialogs/assets-edit-dialog"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"

// Context para compartir el fileTreeRef entre header y content
const NavKnowledgeContext = React.createContext<{
  fileTreeRef: React.RefObject<FileTreeRef | null>
  handleCreateAsset: (folderId?: string) => void
  handleCreateFolder: (folderId?: string) => void
  handleDeleteFolder: (folderId: string, folderName: string) => void
  handleEditFolder: (folderId: string, currentName: string) => void
  handleDeleteDocument: (documentId: string, documentName: string) => void
  handleEditDocument: (documentId: string, currentName: string) => void
  refreshFileTree: () => void
} | null>(null)

export function NavKnowledgeProvider({ children }: { children: React.ReactNode }) {
  const navigate = useOrgNavigate()
  const fileTreeRef = useRef<FileTreeRef>(null)
  const [createAssetDialogOpen, setCreateAssetDialogOpen] = useState(false)
  const [renderCreateAssetDialog, setRenderCreateAssetDialog] = useState(false)
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

  const handleFolderDeleted = useCallback(async () => {
    if (!folderToDelete || !selectedOrganizationId) return

    try {
      await deleteFolder(folderToDelete.id, selectedOrganizationId)
      toast.success(`Folder "${folderToDelete.name}" deleted successfully`)
      setDeleteFolderDialogOpen(false)
      setFolderToDelete(null)
      fileTreeRef.current?.refresh()
    } catch (error) {
      handleApiError(error, { fallbackMessage: 'Failed to delete folder. Please try again.' })
      throw error
    }
  }, [folderToDelete, selectedOrganizationId])

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
      toast.success(`Document "${doc.name}" deleted successfully`)

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
      handleApiError(error, { fallbackMessage: 'Failed to delete document. Please try again.' })
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

  const refreshFileTree = useCallback(() => {
    console.log('🔄 [NAV-KNOWLEDGE] Refreshing file tree')
    fileTreeRef.current?.refresh()
  }, [])

  return (
    <NavKnowledgeContext.Provider value={{ fileTreeRef, handleCreateAsset, handleCreateFolder, handleDeleteFolder, handleEditFolder, handleDeleteDocument, handleEditDocument, refreshFileTree }}>
      {children}
      {renderCreateAssetDialog && (
        <CreateAssetDialog
          open={createAssetDialogOpen}
          onOpenChange={handleCreateAssetDialogChange}
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

export function NavKnowledgeHeader() {
  const { selectedOrganizationId } = useOrganization()
  const { fileTreeRef, handleCreateAsset, handleCreateFolder } = useNavKnowledge()
  const { canCreate } = useUserPermissions()

  const canCreateAsset = canCreate('asset')
  const canCreateFolder = canCreate('folder')
  const hasAnyCreatePermission = canCreateAsset || canCreateFolder

  if (!selectedOrganizationId) {
    return null
  }

  return (
    <SidebarGroup className="py-0">
      <div className="flex items-center justify-between">
        <SidebarGroupLabel className="py-0 text-xs">Knowledge</SidebarGroupLabel>
        <div className="flex items-center gap-1">
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
                    New Asset
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
                    New Folder
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </SidebarGroup>
  )
}

export function NavKnowledgeContent() {
  const navigate = useOrgNavigate()
  const location = useLocation()
  const { selectedOrganizationId } = useOrganization()
  const { fileTreeRef, handleCreateAsset, handleCreateFolder, handleDeleteFolder, handleEditFolder, handleDeleteDocument, handleEditDocument } = useNavKnowledge()
  const [folderNames, setFolderNames] = useState<Map<string, string>>(new Map())
  const [documentNames, setDocumentNames] = useState<Map<string, string>>(new Map())
  const previousOrgId = React.useRef<string | null>(null)
  const { canCreate, canUpdate, canDelete } = useUserPermissions()

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

  const handleLoadChildren = useCallback(
    async (folderId: string | null): Promise<FileNode[]> => {
      if (!selectedOrganizationId) return []

      try {
        const content = await getLibraryContent(selectedOrganizationId, folderId === null ? undefined : folderId)
        
        const nodes = content.content.map((item: any) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          document_type: item.document_type,
          access_levels: item.access_levels,
          ...(item.type === "folder" && { hasChildren: true }),
        }))

        // Store folder and document names for later use in delete dialog
        setFolderNames((prev) => {
          const newMap = new Map(prev)
          content.content.forEach((item: any) => {
            if (item.type === "folder") {
              newMap.set(item.id, item.name)
            }
          })
          return newMap
        })
        
        setDocumentNames((prev) => {
          const newMap = new Map(prev)
          content.content.forEach((item: any) => {
            if (item.type === "document") {
              newMap.set(item.id, item.name)
            }
          })
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
      }
    },
    [navigate]
  )

  const handleMoveFolder = useCallback(
    async (folderId: string, parentFolderId: string | null) => {
      if (!selectedOrganizationId) return

      try {
        await moveFolder(folderId, parentFolderId === null ? undefined : parentFolderId, selectedOrganizationId)
        toast.success('Folder moved successfully')
        fileTreeRef.current?.refresh()
      } catch (error) {
        handleApiError(error, { fallbackMessage: 'Failed to move folder. Please try again.' })
      }
    },
    [selectedOrganizationId]
  )

  const handleMoveFile = useCallback(
    async (documentId: string, folderId: string | null) => {
      if (!selectedOrganizationId) return

      try {
        await moveDocument(documentId, folderId === null ? undefined : folderId, selectedOrganizationId)
        toast.success('Document moved successfully')
        fileTreeRef.current?.refresh()
      } catch (error) {
        handleApiError(error, { fallbackMessage: 'Failed to move document. Please try again.' })
      }
    },
    [selectedOrganizationId]
  )

  const menuActions: MenuAction[] = [
    {
      label: "New Asset",
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
      label: "New Folder",
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
      label: "Edit Folder",
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
      label: "Delete Folder",
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
      label: "Edit File",
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
      label: "Delete File",
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
      />
    </SidebarGroup>
  )
}
