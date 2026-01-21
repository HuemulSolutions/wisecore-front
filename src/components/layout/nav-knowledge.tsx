"use client"

import * as React from "react"
import { Plus, File, Folder, RefreshCw, Edit, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
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
import { useOrganization } from "@/contexts/organization-context"
import { getLibraryContent, moveFolder, deleteFolder } from "@/services/folders"
import { moveDocument, deleteDocument } from "@/services/assets"
import { CreateAssetDialog } from "@/components/assets/dialogs/assets-create-dialog"
import { CreateFolderDialog } from "@/components/assets/dialogs/assets-create-folder-dialog"
import { DeleteFolderDialog } from "@/components/assets/dialogs/assets-delete-folder-dialog"
import { DeleteDocumentDialog } from "@/components/assets/dialogs/assets-delete-dialog"
import EditFolder from "@/components/assets/dialogs/assets-edit_folder"
import EditDocumentDialog from "@/components/assets/dialogs/assets-edit-dialog"
import { toast } from "sonner"

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
  const navigate = useNavigate()
  const fileTreeRef = useRef<FileTreeRef>(null)
  const [createAssetDialogOpen, setCreateAssetDialogOpen] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false)
  const [deleteDocumentDialogOpen, setDeleteDocumentDialogOpen] = useState(false)
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false)
  const [editDocumentDialogOpen, setEditDocumentDialogOpen] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined)
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string } | null>(null)
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null)
  const [folderToEdit, setFolderToEdit] = useState<{ id: string; name: string } | null>(null)
  const [documentToEdit, setDocumentToEdit] = useState<{ id: string; name: string } | null>(null)
  const { selectedOrganizationId } = useOrganization()

  const handleCreateAsset = useCallback((folderId?: string) => {
    setCurrentFolderId(folderId)
    setCreateAssetDialogOpen(true)
  }, [])

  const handleCreateFolder = useCallback((folderId?: string) => {
    setCurrentFolderId(folderId)
    setCreateFolderDialogOpen(true)
  }, [])

  const handleAssetCreated = useCallback((createdAsset?: { id: string; name: string; type: string }) => {
    console.log('📥 [NAV-KNOWLEDGE] handleAssetCreated called:', createdAsset)
    console.log('🔄 [NAV-KNOWLEDGE] Refreshing file tree')
    fileTreeRef.current?.refresh()
    // Navigate to the newly created asset
    if (createdAsset) {
      console.log('🧭 [NAV-KNOWLEDGE] Navigating to asset:', `/asset/${createdAsset.id}`)
      navigate(`/asset/${createdAsset.id}`, {
        state: {
          selectedDocumentId: createdAsset.id,
          selectedDocumentName: createdAsset.name,
          selectedDocumentType: createdAsset.type,
          fromFileTree: true,
        }
      })
      console.log('✓ [NAV-KNOWLEDGE] Navigation initiated')
    }
  }, [navigate])

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
      console.error('Error deleting folder:', error)
      toast.error('Failed to delete folder. Please try again.')
      throw error
    }
  }, [folderToDelete, selectedOrganizationId])

  const handleDocumentDeleted = useCallback(async () => {
    if (!documentToDelete || !selectedOrganizationId) return

    try {
      await deleteDocument(documentToDelete.id, selectedOrganizationId)
      toast.success(`Document "${documentToDelete.name}" deleted successfully`)
      setDeleteDocumentDialogOpen(false)
      setDocumentToDelete(null)
      fileTreeRef.current?.refresh()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document. Please try again.')
      throw error
    }
  }, [documentToDelete, selectedOrganizationId])

  const handleCreateAssetDialogChange = useCallback((open: boolean) => {
    console.log('🔄 [NAV-KNOWLEDGE] CreateAssetDialog onOpenChange:', open)
    setCreateAssetDialogOpen(open)
  }, [])

  const refreshFileTree = useCallback(() => {
    console.log('🔄 [NAV-KNOWLEDGE] Refreshing file tree')
    fileTreeRef.current?.refresh()
  }, [])

  return (
    <NavKnowledgeContext.Provider value={{ fileTreeRef, handleCreateAsset, handleCreateFolder, handleDeleteFolder, handleEditFolder, handleDeleteDocument, handleEditDocument, refreshFileTree }}>
      {children}
      <CreateAssetDialog
        open={createAssetDialogOpen}
        onOpenChange={handleCreateAssetDialogChange}
        folderId={currentFolderId}
        onAssetCreated={handleAssetCreated}
      />
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
      <DeleteDocumentDialog
        open={deleteDocumentDialogOpen}
        onOpenChange={setDeleteDocumentDialogOpen}
        documentName={documentToDelete?.name || ""}
        onConfirm={handleDocumentDeleted}
      />
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

export function NavKnowledgeHeader() {
  const { selectedOrganizationId } = useOrganization()
  const { fileTreeRef, handleCreateAsset, handleCreateFolder } = useNavKnowledge()

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:cursor-pointer">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onSelect={() => {
                  setTimeout(() => handleCreateAsset(), 0)
                }} 
                className="hover:cursor-pointer"
              >
                <File className="mr-2 h-4 w-4" />
                New Asset
              </DropdownMenuItem>
              <DropdownMenuItem 
                onSelect={() => {
                  setTimeout(() => handleCreateFolder(), 0)
                }} 
                className="hover:cursor-pointer"
              >
                <Folder className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </SidebarGroup>
  )
}

export function NavKnowledgeContent() {
  const navigate = useNavigate()
  const { selectedOrganizationId } = useOrganization()
  const { fileTreeRef, handleCreateAsset, handleCreateFolder, handleDeleteFolder, handleEditFolder, handleDeleteDocument, handleEditDocument } = useNavKnowledge()
  const [folderNames, setFolderNames] = useState<Map<string, string>>(new Map())
  const [documentNames, setDocumentNames] = useState<Map<string, string>>(new Map())
  const previousOrgId = React.useRef<string | null>(null)

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
        console.error("Error moving folder:", error)
        toast.error('Failed to move folder. Please try again.')
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
        console.error("Error moving document:", error)
        toast.error('Failed to move document. Please try again.')
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
      show: (node) => node.type === "folder",
      variant: "default",
    },
    {
      label: "New Folder",
      icon: <Folder className="h-4 w-4" />,
      onClick: async (nodeId) => {
        handleCreateFolder(nodeId)
      },
      show: (node) => node.type === "folder",
      variant: "default",
    },
    {
      label: "Edit Folder",
      icon: <Edit className="h-4 w-4" />,
      onClick: async (nodeId) => {
        const folderName = folderNames.get(nodeId) || ""
        handleEditFolder(nodeId, folderName)
      },
      show: (node) => node.type === "folder",
      variant: "default",
    },
    {
      label: "Delete Folder",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (nodeId) => {
        const folderName = folderNames.get(nodeId) || ""
        handleDeleteFolder(nodeId, folderName)
      },
      show: (node) => node.type === "folder",
      variant: "destructive",
    },
    {
      label: "Edit File",
      icon: <Edit className="h-4 w-4" />,
      onClick: async (nodeId) => {
        const documentName = documentNames.get(nodeId) || ""
        handleEditDocument(nodeId, documentName)
      },
      show: (node) => node.type === "document",
      variant: "default",
    },
    {
      label: "Delete File",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: async (nodeId) => {
        const documentName = documentNames.get(nodeId) || ""
        handleDeleteDocument(nodeId, documentName)
      },
      show: (node) => node.type === "document",
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
