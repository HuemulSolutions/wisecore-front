"use client"

import * as React from "react"
import { File, Folder, FolderOpen, FolderPlus, FolderKanban, Users, Share2, Edit, Trash2, FileUp, FolderUp, ShieldCheck, Sparkles, ChevronLeft } from "lucide-react"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type { MenuAction } from "@/types/menu-action"

import {
  SidebarGroup,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { NavKnowledgeCreateMenu } from "@/components/layout/nav-knowledge-create-menu"
import { HuemulPanelHeader } from "@/huemul/components/huemul-panel-header"
import { NavKnowledgeSearchResults } from "@/components/layout/nav-knowledge-search-results"
import { FileTree } from "@/components/assets/content/assets-file-tree"
import type { FileNode, FileTreePage } from "@/types/assets"
import { useLocation } from "react-router-dom"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { getLibraryContent, moveFolder } from "@/services/folders"
import type { LibraryContent } from "@/types/folders"
import { moveDocument } from "@/services/assets"
import { toast } from "sonner"
import { useOptionalEditingGuard } from "@/contexts/editing-guard-context"
import { ApiError } from "@/types/api-error"
import { logger } from "@/lib/logger"
import { useNavKnowledge } from "@/contexts/nav-knowledge-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useLibraryTreeExpansion } from "@/hooks/useLibraryTreeExpansion"
import { handleFolderActionError, isRootGroupFolderNode, buildFocusedTree, parsePageCursor, toTreePage } from "@/components/layout/nav-knowledge-utils"
import { TREE_CHILDREN_PAGE_SIZE } from "@/huemul/constants"
import type { HuemulTreePageRequest } from "@/types/huemul/tree"

// Página de la carga raíz enriquecida (foco + carpetas expandidas resueltas por backend).
const ROOT_ENRICHED_PAGE_SIZE = 1000

// Las áreas (subcarpetas de Grupal) se distinguen visualmente de una carpeta común.
function renderKnowledgeFolderIcon(node: FileNode, isExpanded: boolean) {
  if (node.folder_type === "area") {
    return <Users className="h-3.5 w-3.5 text-blue-500 shrink-0" />
  }
  if (node.isRootGroup) {
    return <FolderKanban className="h-3.5 w-3.5 text-purple-500 shrink-0" />
  }
  // Headers de sistema (Global/Forms/Personal/Grupal/Sin carpeta) van sin icono.
  if (node.isSystem) return null
  return isExpanded
    ? <FolderOpen className="h-3.5 w-3.5 text-blue-500 shrink-0" />
    : <Folder className="h-3.5 w-3.5 text-blue-500 shrink-0" />
}

export interface NavKnowledgeHeaderProps {
  /**
   * Botón de refresco del árbol. Se apaga en las páginas que ya ofrecen un
   * refresh en su `PageHeader` (un botón por contenedor, no por endpoint).
   */
  showRefresh?: boolean
  /** Si se pasa, muestra el botón para colapsar el panel a su rail. */
  onCollapse?: () => void
}

export function NavKnowledgeHeader({ showRefresh = true, onCollapse }: NavKnowledgeHeaderProps = {}) {
  const { t } = useTranslation('layout')
  const { selectedOrganizationId } = useOrganization()
  const { fileTreeRef, isSearchOpen, setIsSearchOpen, searchTerm, setSearchTerm, setCommittedSearch } = useNavKnowledge()
  const [isRefreshingTree, setIsRefreshingTree] = useState(false)

  const handleRefreshTree = async () => {
    setIsRefreshingTree(true)
    try {
      await fileTreeRef.current?.refresh()
    } finally {
      setIsRefreshingTree(false)
    }
  }

  if (!selectedOrganizationId) {
    return null
  }

  return (
    <HuemulPanelHeader
      title={t('knowledge.sectionTitle')}
      search={{
        value: searchTerm,
        onChange: setSearchTerm,
        onCommit: setCommittedSearch,
        placeholder: t('knowledge.searchPlaceholder'),
        open: isSearchOpen,
        onOpenChange: setIsSearchOpen,
      }}
      onRefresh={showRefresh ? handleRefreshTree : undefined}
      isRefreshing={isRefreshingTree}
      actions={
        <>
          <NavKnowledgeCreateMenu />
          {onCollapse && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:cursor-pointer"
              onClick={onCollapse}
              title={t('knowledge.collapse')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </>
      }
    />
  )
}

export interface NavKnowledgeContentProps {
  /**
   * Modo editor de diagramas (/diagrams): los assets se arrastran al canvas en
   * vez de abrirse. Es una prop y no un estado global porque el modo ya no es
   * un toggle que viaja entre páginas: lo determina la página que monta el árbol.
   */
  diagramMode?: boolean
}

export function NavKnowledgeContent({ diagramMode = false }: NavKnowledgeContentProps = {}) {
  const { t } = useTranslation('layout')
  const navigate = useOrgNavigate()
  const location = useLocation()
  const { selectedOrganizationId } = useOrganization()
  const { fileTreeRef, pendingFocusAssetIdRef, revealedNodeId, handleCreateAsset, handleImportAsset, handleImportAssetFromExternal, handleCreateFolder, handleShareFolder, handleDeleteFolder, handleEditFolder, handleDeleteDocument, handleEditDocument, handleOpenAssetLifecycle, committedSearch, setCommittedSearch, setSearchTerm } = useNavKnowledge()
  const [folderNames, setFolderNames] = useState<Map<string, string>>(new Map())
  const [documentNames, setDocumentNames] = useState<Map<string, string>>(new Map())
  const [documentTypeIds, setDocumentTypeIds] = useState<Map<string, string>>(new Map())
  const [nodeParentIds, setNodeParentIds] = useState<Map<string, string | null>>(new Map())
  // access_levels por nodo: los handlers de mover (gesto de drag, sin botón)
  // necesitan el grant del nodo, igual que el item de kebab "Mover a raíz".
  const [nodeAccessLevels, setNodeAccessLevels] = useState<Map<string, string[]>>(new Map())
  const previousOrgId = React.useRef<string | null>(null)
  const { canCreate, canUpdate, canDelete, isOrgAdmin, hasAnyPermission, canAccessRoleFolders, canManageGroupFolders } = useUserPermissions()
  const { can } = usePageAccess('asset')
  // Requiere poder listar AMBOS catálogos: sin systems no hay cascada, sin functionalities no hay qué elegir.
  const canBrowseExternalCatalog =
    isOrgAdmin ||
    (hasAnyPermission(['external_system:l', 'external_system:r']) &&
      hasAnyPermission(['external_functionality:l', 'external_functionality:r']))
  // El árbol no usa React Query (llama getLibraryContent directo), así que el
  // gate de listar va como early-return en cada punto de carga en vez de un
  // `enabled` — ver punto 3 del checklist en ia context/rbac-audit-guide.md.
  const canListLibrary = can('listAssets') || can('listFolders')
  const { guardedAction } = useOptionalEditingGuard()
  const { loadRoot, treeProps: expansionTreeProps } = useLibraryTreeExpansion({
    organizationId: selectedOrganizationId,
    // El sidebar es la única superficie persistente montada todo el tiempo:
    // si otro navegador cambió la expansión mientras tanto, vale la pena el
    // refresh único al hidratar. Un picker efímero no lo pide (ver el hook).
    refreshOnServerDiffered: true,
    treeRef: fileTreeRef,
  })
  // Ref para que handleLoadChildren (deps acotadas, ver más abajo) siempre
  // lea la versión vigente de loadRoot sin tener que recrearse en cada
  // render — mismo idiom que activeAssetIdRef/pendingFocusAssetIdRef en este
  // archivo.
  const loadRootRef = useRef(loadRoot)
  loadRootRef.current = loadRoot

  /**
   * Qué nodos puede arrastrar el usuario. Mismo predicado que el item de kebab
   * "Mover a raíz" (`canUpdate` global O `access_levels` del nodo): un gesto sin
   * botón necesita el mismo permiso que el botón equivalente. Se evalúa por nodo
   * y no con un booleano global para no quitarle el drag a quien mueve sus
   * carpetas por grant sin tener el permiso global.
   */
  const canDragNode = useCallback((node: FileNode) => {
    if (node.type === "folder") {
      // Ninguna carpeta de sistema (incluida Área) es reparentable
      if (node.folder_type) return false
      return canUpdate('folder') || node.access_levels?.includes('edit') || false
    }
    return canUpdate('asset') || node.access_levels?.includes('edit') || false
  }, [canUpdate])

  /**
   * Qué carpeta puede RECIBIR un drop. Distinto de canDragNode (que decide
   * qué nodo se puede arrastrar): Grupal y Forms no admiten contenido
   * directo — misma regla que las acciones de crear del menú (ver `show` de
   * `menuActions` más abajo).
   */
  const canDropNode = useCallback((node: FileNode) => {
    if (node.type !== "folder") return false
    return node.folder_type !== 'grupal' && node.folder_type !== 'forms'
  }, [])

  // Extract active asset ID from URL (pattern: /asset/<folder>/.../<assetId>).
  // The asset (if present) is always the LAST segment — buildUrlPath puts
  // breadcrumb folders first and the file id last.
  const activeAssetId = React.useMemo(() => {
    const match = location.pathname.match(/\/asset(\/[^?]*)?/)
    if (!match) return null
    const segments = (match[1] ?? '').split('/').filter(Boolean)
    return segments.length > 0 ? segments[segments.length - 1] : null
  }, [location.pathname])

  // Always reflects the current asset in the URL — used by both initial load and refresh
  const activeAssetIdRef = useRef(activeAssetId)
  activeAssetIdRef.current = activeAssetId

  // El foco automático (revelar la cadena de carpetas del asset abierto, como
  // VS Code revela el archivo activo) solo debe aplicar a la primera carga
  // root del montaje — refrescos posteriores no deben reexpandir esa cadena
  // por encima de lo que el usuario haya colapsado. Se resetea al cambiar de
  // organización porque este componente no se remonta ahí (solo FileTree, por
  // su `key`).
  const didInitialRootLoadRef = useRef(false)

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
      didInitialRootLoadRef.current = false
      fileTreeRef.current?.refresh()
    }
  }, [selectedOrganizationId, fileTreeRef])

  // El refresh único ante `serverDiffered` (otro navegador/dispositivo cambió
  // la expansión mientras tanto) lo maneja useLibraryTreeExpansion
  // internamente (refreshOnServerDiffered: true, arriba).

  // Paginación POR NODO: el árbol pide `{ cursor, limit }` y esta función devuelve una
  // `FileTreePage` (ver ia context/paginacion-por-nodo-arbol-guide.md). Sin cursor es la
  // primera página de esa carpeta (o de la raíz, `folderId === null`).
  const handleLoadChildren = useCallback(
    async (
      folderId: string | null,
      _node?: FileNode,
      pageRequest?: HuemulTreePageRequest,
    ): Promise<FileTreePage> => {
      const emptyPage: FileTreePage = { items: [], hasMore: false, nextCursor: null }
      if (!selectedOrganizationId) return emptyPage
      // Sin permiso de listar assets ni carpetas no se pega al backend.
      if (!canListLibrary) return emptyPage

      const isFirstPage = !pageRequest?.cursor
      try {
        const isRoot = folderId === null
        const { page, pageSize, opaque } = parsePageCursor(
          pageRequest?.cursor,
          pageRequest?.limit ?? TREE_CHILDREN_PAGE_SIZE,
        )
        // El asset activo de la URL solo enfoca la PRIMERA carga root del
        // montaje (revela su cadena de carpetas, como VS Code revela el
        // archivo activo). Un `pendingFocusAssetIdRef` explícito (reveal desde
        // un sheet, asset recién creado) sigue funcionando en cualquier carga.
        // Sin este corte, cada refresh reexpandiría la cadena del asset
        // abierto por encima de lo que el usuario haya colapsado. Las páginas
        // siguientes de la raíz (con cursor) nunca enfocan ni consumen nada.
        const focusAssetId = isRoot && isFirstPage
          ? (pendingFocusAssetIdRef.current ?? (didInitialRootLoadRef.current ? null : activeAssetIdRef.current))
          : null
        if (isRoot && isFirstPage) didInitialRootLoadRef.current = true
        // Consumo único — no debe reusarse en refrescos posteriores no
        // relacionados, ni siquiera si esta carga falla.
        if (isRoot && isFirstPage && pendingFocusAssetIdRef.current) pendingFocusAssetIdRef.current = null

        let content: LibraryContent
        // `enrichedRootLoad` marca si la respuesta trae is_expanded/foco
        // resueltos server-side (loadRoot decide y hace su propio fallback a
        // carga plana ante 400/404 — ver useLibraryTreeExpansion).
        let enrichedRootLoad = false
        // Tamaño de página realmente usado: el cursor de respaldo de la página
        // siguiente debe alinearse con él.
        let usedPageSize = pageSize
        if (isRoot) {
          const rootResult = await loadRootRef.current({
            page,
            pageSize,
            // La carga enriquecida nombra carpetas expandidas de cualquier
            // profundidad y se espera completa: va con página grande. Sus
            // carpetas llegan sin paginar hasta que el backend pagine esa
            // respuesta (respuestas/backend-arbol-paginacion-por-carpeta.md §3).
            enrichedPageSize: ROOT_ENRICHED_PAGE_SIZE,
            focusAssetId,
            cursor: opaque,
          })
          content = rootResult.content
          enrichedRootLoad = rootResult.enriched
          if (enrichedRootLoad) usedPageSize = ROOT_ENRICHED_PAGE_SIZE
        } else {
          content = await getLibraryContent(
            selectedOrganizationId,
            folderId!,
            page,
            pageSize,
            undefined,
            undefined,
            undefined,
            opaque ? { cursor: opaque } : undefined,
          )
        }

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

        setDocumentTypeIds((prev) => {
          const newMap = new Map(prev)
          content.assets.forEach((item) => {
            if (item.document_type?.id) newMap.set(item.id, item.document_type.id)
          })
          return newMap
        })

        setNodeAccessLevels((prev) => {
          const newMap = new Map(prev)
          content.folders.forEach((item) => { if (item.access_levels) newMap.set(item.id, item.access_levels) })
          content.assets.forEach((item) => { if (item.access_levels) newMap.set(item.id, item.access_levels) })
          return newMap
        })

        // Track parent folder for each node so we can show "Move to Root" only for non-root nodes
        setNodeParentIds((prev) => {
          const newMap = new Map(prev)
          if (enrichedRootLoad) {
            content.folders.forEach((f) => newMap.set(f.id, f.parent_folder_id))
            content.assets.forEach((a) => newMap.set(a.id, a.folder_id))
          } else {
            [...content.folders.map(f => f.id), ...content.assets.map(a => a.id)]
              .forEach((id) => newMap.set(id, folderId))
          }
          return newMap
        })

        if (enrichedRootLoad) {
          return toTreePage(buildFocusedTree(content), content, page, usedPageSize)
        }

        const folderNodes: FileNode[] = (content.folders ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          type: 'folder',
          hasChildren: true,
          isSystem: item.folder_type != null && item.folder_type !== 'area',
          folder_type: item.folder_type,
          isRootGroup: isRoot && isRootGroupFolderNode(item.folder_type, item.parent_folder_id),
          access_levels: item.access_levels,
          is_grantable: item.is_grantable,
        }))

        const assetNodes: FileNode[] = (content.assets ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          type: 'document',
          document_type: item.document_type,
          access_levels: item.access_levels,
        }))

        return toTreePage([...folderNodes, ...assetNodes], content, page, usedPageSize)
      } catch (error) {
        logger.error("Error loading folder content:", error)
        if (ApiError.isApiError(error) && (error.statusCode === 404 || error.code === 'FOLDER_NOT_FOUND')) {
          toast.error(t('knowledge.errors.folderNotAccessible'))
        } else {
          toast.error(t('knowledge.errors.folderLoadError'))
        }
        // Un "Mostrar más" fallido propaga el error: el árbol conserva lo ya
        // cargado y deja la fila para reintentar. Una primera página fallida
        // se ve como carpeta vacía, igual que antes.
        if (!isFirstPage) throw error
        return emptyPage
      }
    },
    [selectedOrganizationId, t, canListLibrary]
  )

  const handleRefreshTree = useCallback(
    (pageRequest?: HuemulTreePageRequest) => handleLoadChildren(null, undefined, pageRequest),
    [handleLoadChildren]
  )

  const handleFileClick = useCallback(
    async (node: FileNode) => {
      // En el editor de diagramas el árbol es la fuente de arrastre: hacer clic
      // en un asset no debe sacar al usuario del canvas que está editando.
      if (diagramMode) return
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
    [navigate, guardedAction, diagramMode]
  )

  const handleMoveFolder = useCallback(
    async (folderId: string, parentFolderId: string | null) => {
      if (!selectedOrganizationId) return
      // Capa (c) del gate del gesto: el drag ya está deshabilitado por
      // canDragNode, pero el handler no debe mutar si alguien lo alcanza igual.
      if (!canUpdate('folder') && !nodeAccessLevels.get(folderId)?.includes('edit')) return

      try {
        await moveFolder(folderId, parentFolderId === null ? undefined : parentFolderId, selectedOrganizationId)
        const destination = parentFolderId === null
          ? t('knowledge.rootFolder')
          : (folderNames.get(parentFolderId) ?? parentFolderId)
        toast.success(t('knowledge.folderMovedSuccess', { destination }))
      } catch (error) {
        handleFolderActionError(error, t, t('knowledge.folderMoveError'))
      }
    },
    [selectedOrganizationId, folderNames, nodeAccessLevels, canUpdate, t]
  )

  const handleMoveFile = useCallback(
    async (documentId: string, folderId: string | null) => {
      if (!selectedOrganizationId) return
      // Capa (c) del gate del gesto — ver handleMoveFolder.
      if (!canUpdate('asset') && !nodeAccessLevels.get(documentId)?.includes('edit')) return

      try {
        await moveDocument(documentId, folderId === null ? undefined : folderId, selectedOrganizationId)
        const destination = folderId === null
          ? t('knowledge.rootFolder')
          : (folderNames.get(folderId) ?? folderId)
        toast.success(t('knowledge.documentMovedSuccess', { destination }))
      } catch (error) {
        handleFolderActionError(error, t, t('knowledge.documentMoveError'))
      }
    },
    [selectedOrganizationId, folderNames, nodeAccessLevels, canUpdate, t]
  )

  // Debe declararse antes de cualquier early return (ver bug de "Rendered more
  // hooks than during the previous render" cuando selectedOrganizationId pasa
  // de null a un valor y este hook aparecía después del guard de abajo).
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

  const menuActions: MenuAction[] = [
    {
      label: t('knowledge.newAsset'),
      icon: <File className="h-4 w-4" />,
      onClick: async (nodeId) => {
        handleCreateAsset(nodeId)
      },
      show: (node) => {
        if (node.type !== "folder") return false
        // Nadie crea contenido directo en Grupal (solo áreas) ni en Forms
        if (node.folder_type === 'grupal' || node.folder_type === 'forms') return false
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
        if (node.folder_type === 'grupal' || node.folder_type === 'forms') return false
        return canCreate('asset') || node.access_levels?.includes('create') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.importAssetFromExternal'),
      icon: <Sparkles className="h-4 w-4" />,
      onClick: async (nodeId) => {
        handleImportAssetFromExternal(nodeId)
      },
      show: (node) => {
        if (node.type !== "folder") return false
        if (node.folder_type === 'grupal' || node.folder_type === 'forms') return false
        if (!canBrowseExternalCatalog) return false
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
        if (node.folder_type === 'grupal' || node.folder_type === 'forms') return false
        return canCreate('folder') || node.access_levels?.includes('create') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.newArea'),
      icon: <FolderPlus className="h-4 w-4" />,
      onClick: async (nodeId) => {
        handleCreateFolder(nodeId)
      },
      // Solo dentro de Grupal, y solo un org admin puede crear áreas.
      show: (node) => node.type === "folder" && node.folder_type === 'grupal' && isOrgAdmin,
      variant: "default",
    },
    {
      label: t('knowledge.shareFolder'),
      icon: <Share2 className="h-4 w-4" />,
      onClick: async (nodeId) => {
        handleShareFolder({ id: nodeId, name: folderNames.get(nodeId) || "" })
      },
      // Compartir accesos por rol: el backend marca qué carpetas admiten grants (is_grantable),
      // con la misma regla que valida POST /role-folder. El fallback por folder_type cubre
      // superficies/deploys que todavía no devuelvan el flag — mismo alcance que antes.
      show: (node) =>
        node.type === "folder" &&
        canAccessRoleFolders &&
        (node.is_grantable ??
          (node.folder_type === 'global' || node.folder_type === 'forms' ||
            node.folder_type === 'area' || !!node.isRootGroup)),
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
        // Personal y "Sin carpeta" nunca se renombran (nombre fijo del sistema)
        if (node.folder_type === 'personal' || node.folder_type === 'sin_carpeta') return false
        // Grupal solo lo renombra un org admin
        if (node.folder_type === 'grupal') return isOrgAdmin
        // Global / Forms / Área: requieren administer (permiso global o access_level edit)
        return canUpdate('folder') || node.access_levels?.includes('edit') || false
      },
      variant: "default",
    },
    {
      label: t('knowledge.moveToRoot'),
      icon: <FolderUp className="h-4 w-4" />,
      onClick: async (nodeId) => {
        await handleMoveFolder(nodeId, null)
        fileTreeRef.current?.refresh()
      },
      show: (node) => {
        if (node.type !== "folder") return false
        // Ninguna carpeta de sistema (incluida Área) es reparentable
        if (node.folder_type) return false
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
        // Personal/Global/Forms/Grupal/Sin carpeta: nunca eliminables por este endpoint
        if (node.folder_type && node.folder_type !== 'area') return false
        // Área: requiere administer. Carpeta grupal custom de raíz: administer O folder:manage_groups
        // (sin necesitar grant propio). Carpetas normales: permiso genérico.
        return canDelete('folder')
          || node.access_levels?.includes('delete')
          || (node.isRootGroup && canManageGroupFolders)
          || false
      },
      variant: "destructive",
    },
    {
      label: t('knowledge.moveToRoot'),
      icon: <FolderUp className="h-4 w-4" />,
      onClick: async (nodeId) => {
        await handleMoveFile(nodeId, null)
        fileTreeRef.current?.refresh()
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
      label: t('knowledge.assetPermissions'),
      icon: <ShieldCheck className="h-4 w-4" />,
      onClick: async (nodeId) => {
        const documentName = documentNames.get(nodeId) || ""
        const documentTypeId = documentTypeIds.get(nodeId) ?? null
        handleOpenAssetLifecycle(nodeId, documentName, documentTypeId)
      },
      // Otorgar/revocar grants de lifecycle es escritura sobre el asset
      // (POST /lifecycle/documents/{id}/grants), no una acción de solo lectura.
      show: (node) => node.type === "document" && can('manageAssetLifecycleGrants'),
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

  return (
    <>
    <SidebarGroup>
      {committedSearch ? (
        <NavKnowledgeSearchResults
          organizationId={selectedOrganizationId}
          search={committedSearch}
          enabled={canListLibrary}
          diagramMode={diagramMode}
          activeAssetId={activeAssetId}
          onOpenAsset={handleFileClick}
          onClear={() => {
            setSearchTerm('')
            setCommittedSearch('')
          }}
        />
      ) : (
        <FileTree
          key={selectedOrganizationId}
          ref={fileTreeRef}
          onLoadChildren={handleLoadChildren}
          onRefresh={handleRefreshTree}
          onFileClick={handleFileClick}
          onMoveFolder={handleMoveFolder}
          onMoveFile={handleMoveFile}
          canDragNode={canDragNode}
          canDropNode={canDropNode}
          onDelete={handleDelete}
          activeNodeId={activeAssetId}
          menuActions={menuActions}
          showDefaultActions={{ create: false, delete: false, share: false }}
          showCreateButtons={false}
          initialFolderId={null}
          showBorder={false}
          // El refresh ya lo ofrece el botón del header de la sección (NavKnowledgeHeader) —
          // un solo control por contenedor.
          showRefreshButton={false}
          alwaysShowMenuActions={true}
          // La carga root ahora siempre trae la expansión resuelta por el
          // backend (foco + expanded_folder_ids persistidas), así que su
          // respuesta es autoritativa — evita el camino de N requests (una
          // por carpeta expandida) que preserveExpandedOnRefresh={true}
          // dispararía en cada refresh. Ambas props vienen del hook.
          {...expansionTreeProps}
          renderLeafIcon={(node) => {
            const fileNode = node as FileNode
            const color = fileNode.document_type?.color
            return <File className="h-3.5 w-3.5 shrink-0" style={{ color: color ?? undefined }} />
          }}
          renderFolderIcon={(node, isExpanded) => renderKnowledgeFolderIcon(node as FileNode, isExpanded)}
          renderNodeClassName={(node) => (revealedNodeId === node.id ? "ring-2 ring-[#4464f7] ring-inset" : undefined)}
          onNodeDragStart={diagramMode ? (e, node) => {
            const docType = node.document_type
            if (!docType) return
            e.dataTransfer.setData(
              "application/document-type",
              JSON.stringify({ id: node.id, name: node.name, color: docType.color, documentTypeId: docType.id })
            )
          } : undefined}
          isNodeExpandable={(node) => (node as FileNode).type === "folder"}
        />
      )}
    </SidebarGroup>
    </>
  )
}
