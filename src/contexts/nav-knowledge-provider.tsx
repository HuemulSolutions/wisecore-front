import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { usePageAccess } from "@/hooks/usePageAccess"
import { DEFAULT_PAGE_SIZE } from "@/huemul/constants"
import { deleteFolder } from "@/services/folders"
import { deleteDocument } from "@/services/assets"
import { CreateAssetSheet } from "@/components/assets/dialogs/assets-create-sheet"
import { ImportAssetFromFileSheet } from "@/components/assets/dialogs/assets-import-from-file-sheet"
import { ImportAssetFromExternalSheet } from "@/components/assets/dialogs/assets-import-from-external-sheet"
import { ImportConfigSheet } from "@/components/assets/dialogs/assets-import-config-sheet"
import { CreateFolderSheet } from "@/components/assets/dialogs/assets-create-folder-sheet"
import { DeleteFolderDialog } from "@/components/assets/dialogs/assets-delete-folder-dialog"
import { DeleteDocumentDialog } from "@/components/assets/dialogs/assets-delete-dialog"
import EditFolder from "@/components/assets/dialogs/assets-edit_folder"
import EditDocumentDialog from "@/components/assets/dialogs/assets-edit-dialog"
import AssetLifecycleSheet from "@/components/assets/dialogs/assets-lifecycle-sheet"
import { FolderPermissionsSheet } from "@/components/folders/role-folder-permissions-sheet"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"
import { logger } from "@/lib/logger"
import { NavKnowledgeContext } from "@/contexts/nav-knowledge-context"
import { handleFolderActionError } from "@/components/layout/nav-knowledge-utils"
import type { FileTreeRef } from "@/components/assets/content/assets-file-tree"

// Solo el componente provider vive acá (separado de nav-knowledge-context.ts) para
// que react-refresh pueda auto-aceptar este módulo: un archivo que mezcla
// componente + hooks no se auto-acepta, y un hot update duplicaba el contexto
// (ver comentario en nav-knowledge-context.ts).

export function NavKnowledgeProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('layout')
  const navigate = useOrgNavigate()
  const fileTreeRef = useRef<FileTreeRef>(null)
  const pendingFocusAssetIdRef = useRef<string | null>(null)
  const [createAssetDialogOpen, setCreateAssetDialogOpen] = useState(false)
  const [renderCreateAssetDialog, setRenderCreateAssetDialog] = useState(false)
  const [importAssetDialogOpen, setImportAssetDialogOpen] = useState(false)
  const [renderImportAssetDialog, setRenderImportAssetDialog] = useState(false)
  const [importExternalDialogOpen, setImportExternalDialogOpen] = useState(false)
  const [renderImportExternalDialog, setRenderImportExternalDialog] = useState(false)
  const [importConfigDialogOpen, setImportConfigDialogOpen] = useState(false)
  const [renderImportConfigDialog, setRenderImportConfigDialog] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false)
  const [deleteDocumentDialogOpen, setDeleteDocumentDialogOpen] = useState(false)
  const [renderDeleteDocumentDialog, setRenderDeleteDocumentDialog] = useState(false)
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false)
  const [editDocumentDialogOpen, setEditDocumentDialogOpen] = useState(false)
  const [assetLifecycleSheetOpen, setAssetLifecycleSheetOpen] = useState(false)
  const [assetForLifecycle, setAssetForLifecycle] = useState<{ id: string; name: string; document_type_id: string | null } | null>(null)
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
  const [rootPageSize, setRootPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [hasNextRootPage, setHasNextRootPage] = useState(false)
  const [sharingFolder, setSharingFolder] = useState<{ id: string; name: string } | null>(null)
  const { selectedOrganizationId } = useOrganization()
  const { canAccessRoleFolders } = useUserPermissions()
  const { can: canAsset } = usePageAccess('asset')
  // Marca que la carpeta en creación es una carpeta grupal custom de raíz, para encadenar
  // el sheet de permisos al terminar (sin esto, quien solo tiene folder:manage_groups
  // se queda sin acceso a lo que acaba de crear).
  const pendingGroupFolderRef = useRef(false)

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

  const handleImportAssetFromExternal = useCallback((folderId?: string) => {
    setCurrentFolderId(folderId)
    setRenderImportExternalDialog(true)
    setImportExternalDialogOpen(true)
  }, [])

  const handleImportConfig = useCallback(() => {
    setRenderImportConfigDialog(true)
    setImportConfigDialogOpen(true)
  }, [])

  const handleCreateFolder = useCallback((folderId?: string) => {
    pendingGroupFolderRef.current = false
    setCurrentFolderId(folderId)
    setCreateFolderDialogOpen(true)
  }, [])

  const handleCreateGroupFolder = useCallback(() => {
    pendingGroupFolderRef.current = true
    setCurrentFolderId('root')
    setCreateFolderDialogOpen(true)
  }, [])

  const handleShareFolder = useCallback((folder: { id: string; name: string }) => {
    setSharingFolder(folder)
  }, [])

  const handleAssetCreated = useCallback((createdAsset?: { id: string; name: string; type: string }) => {
    logger.log('📥 [NAV-KNOWLEDGE] handleAssetCreated called:', createdAsset)

    // Wait for the Radix exit animation (200 ms) to finish before
    // triggering navigation, which causes a large re-render cascade
    // through PermissionsProvider.  Navigating during the animation
    // produces a visible "flash" of the dialog portal.
    setTimeout(() => {
      logger.log('🔄 [NAV-KNOWLEDGE] Refreshing file tree')
      // El refresh corre antes de que navigate() actualice la URL, así que
      // activeAssetIdRef (derivado de location.pathname) todavía apunta al
      // asset viejo. Este override deja que handleLoadChildren pida el
      // focus_asset_id correcto sin depender de esa carrera.
      if (createdAsset) {
        pendingFocusAssetIdRef.current = createdAsset.id
      }
      fileTreeRef.current?.refresh()
      // Navigate to the newly created asset
      if (createdAsset) {
        logger.log('🧭 [NAV-KNOWLEDGE] Navigating to asset:', `/asset/${createdAsset.id}`)
        navigateRef.current(`/asset/${createdAsset.id}`, {
          state: {
            selectedDocumentId: createdAsset.id,
            selectedDocumentName: createdAsset.name,
            selectedDocumentType: createdAsset.type,
            fromFileTree: true,
          }
        })
        logger.log('✓ [NAV-KNOWLEDGE] Navigation initiated')
      }
    }, 300)
  }, []) // stable — uses ref for navigate

  const handleFolderCreated = useCallback((folder?: { id: string; name: string }) => {
    fileTreeRef.current?.refresh()
    if (pendingGroupFolderRef.current) {
      pendingGroupFolderRef.current = false
      // Sin un grant propio, quien solo tiene folder:manage_groups no verá esta carpeta
      // después (queda 404 hasta que alguien con role_folder le otorgue acceso a un rol).
      // Encadenamos el sheet de permisos en el mismo flujo de creación.
      if (folder && canAccessRoleFolders) {
        setSharingFolder(folder)
      }
    }
  }, [canAccessRoleFolders])

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
      handleFolderActionError(error, t, t('knowledge.folderDeleteError'))
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
    logger.log('🔄 [NAV-KNOWLEDGE] CreateAssetDialog onOpenChange:', open)
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

  const handleImportExternalDialogChange = useCallback((open: boolean) => {
    setImportExternalDialogOpen(open)
    if (!open) {
      setTimeout(() => setRenderImportExternalDialog(false), 300)
    }
  }, [])

  const handleImportConfigDialogChange = useCallback((open: boolean) => {
    setImportConfigDialogOpen(open)
    if (!open) {
      setTimeout(() => setRenderImportConfigDialog(false), 300)
    }
  }, [])

  const handleOpenAssetLifecycle = useCallback((documentId: string, documentName: string, documentTypeId: string | null) => {
    setAssetForLifecycle({ id: documentId, name: documentName, document_type_id: documentTypeId })
    setAssetLifecycleSheetOpen(true)
  }, [])

  const refreshFileTree = useCallback(() => {
    logger.log('🔄 [NAV-KNOWLEDGE] Refreshing file tree')
    fileTreeRef.current?.refresh()
  }, [])

  // Resalta temporalmente un asset arbitrario (ej. una dependencia) sin navegar:
  // fuerza el próximo root-load a pedir focus_asset_id (expande carpetas ancestro)
  // y prende un resaltado que se apaga solo — no hay forma de "avisar" a este
  // contexto cuando el usuario deja de mirar el sheet que disparó la acción.
  const [revealedNodeId, setRevealedNodeId] = useState<string | null>(null)
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const revealAssetInTree = useCallback((assetId: string) => {
    pendingFocusAssetIdRef.current = assetId
    setRevealedNodeId(assetId)
    fileTreeRef.current?.refresh()
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
    revealTimeoutRef.current = setTimeout(() => setRevealedNodeId(null), 4000)
  }, [])

  useEffect(() => () => {
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current)
  }, [])

  return (
    <NavKnowledgeContext.Provider value={{ fileTreeRef, pendingFocusAssetIdRef, revealedNodeId, revealAssetInTree, handleCreateAsset, handleImportAsset, handleImportAssetFromExternal, handleImportConfig, handleCreateFolder, handleCreateGroupFolder, handleShareFolder, handleDeleteFolder, handleEditFolder, handleDeleteDocument, handleEditDocument, handleOpenAssetLifecycle, refreshFileTree, isSearchOpen, setIsSearchOpen, searchTerm, setSearchTerm, committedSearch, setCommittedSearch, rootPage, rootPageSize, hasNextRootPage, setRootPage, setRootPageSize, setHasNextRootPage }}>
      {children}
      {renderCreateAssetDialog && (
        <CreateAssetSheet
          open={createAssetDialogOpen}
          onOpenChange={handleCreateAssetDialogChange}
          folderId={currentFolderId}
          onAssetCreated={handleAssetCreated}
          canCreate={canAsset('createAsset')}
        />
      )}
      {renderImportAssetDialog && (
        <ImportAssetFromFileSheet
          open={importAssetDialogOpen}
          onOpenChange={handleImportAssetDialogChange}
          folderId={currentFolderId}
          onAssetCreated={handleAssetCreated}
          canCreate={canAsset('createAsset')}
        />
      )}
      {renderImportExternalDialog && (
        <ImportAssetFromExternalSheet
          open={importExternalDialogOpen}
          onOpenChange={handleImportExternalDialogChange}
          folderId={currentFolderId}
          onAssetCreated={handleAssetCreated}
        />
      )}
      {renderImportConfigDialog && (
        <ImportConfigSheet
          open={importConfigDialogOpen}
          onOpenChange={handleImportConfigDialogChange}
          onImported={refreshFileTree}
        />
      )}
      <CreateFolderSheet
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
      <AssetLifecycleSheet
        asset={assetForLifecycle}
        open={assetLifecycleSheetOpen}
        onOpenChange={setAssetLifecycleSheetOpen}
      />
      <FolderPermissionsSheet
        folder={sharingFolder}
        open={!!sharingFolder}
        onOpenChange={(open: boolean) => { if (!open) setSharingFolder(null) }}
      />
    </NavKnowledgeContext.Provider>
  )
}
