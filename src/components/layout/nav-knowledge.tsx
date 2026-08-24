"use client"

import * as React from "react"
import { Plus, File, Folder, FolderOpen, FolderPlus, FolderKanban, Users, Share2, RefreshCw, Edit, Trash2, FileUp, FileJson, FolderUp, ShieldCheck, Sparkles } from "lucide-react"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import type { MenuAction } from "@/types/menu-action"

import {
  SidebarGroup,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { HuemulPanelHeader } from "@/huemul/components/huemul-panel-header"
import { FileTree } from "@/components/assets/content/assets-file-tree"
import type { FileNode } from "@/types/assets"
import { useLocation } from "react-router-dom"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { getLibraryContent, moveFolder } from "@/services/folders"
import type { LibraryContent } from "@/types/folders"
import { moveDocument } from "@/services/assets"
import { toast } from "sonner"
import { useOptionalEditingGuard } from "@/contexts/editing-guard-context"
import { ApiError } from "@/types/api-error"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { useNavKnowledge } from "@/contexts/nav-knowledge-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { handleFolderActionError, isRootGroupFolderNode, buildFocusedTree } from "@/components/layout/nav-knowledge-utils"

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
}

export function NavKnowledgeHeader({ showRefresh = true }: NavKnowledgeHeaderProps = {}) {
  const { t } = useTranslation('layout')
  const { selectedOrganizationId } = useOrganization()
  const { fileTreeRef, handleCreateAsset, handleImportAsset, handleImportAssetFromExternal, handleImportConfig, handleCreateFolder, handleCreateGroupFolder, isSearchOpen, setIsSearchOpen, searchTerm, setSearchTerm, setCommittedSearch } = useNavKnowledge()
  const { canCreate, isOrgAdmin, hasAnyPermission, canManageGroupFolders } = useUserPermissions()
  const [isRefreshingTree, setIsRefreshingTree] = useState(false)

  const handleRefreshTree = async () => {
    setIsRefreshingTree(true)
    try {
      await fileTreeRef.current?.refresh()
    } finally {
      setIsRefreshingTree(false)
    }
  }

  const canCreateAsset = canCreate('asset')
  const canCreateFolder = canCreate('folder')
  // POST /folder/ con parent_folder_id: "root" requiere folder:c y (is_org_admin o folder:manage_groups).
  const canCreateGroupFolder = canCreateFolder && canManageGroupFolders
  // Requiere poder listar AMBOS catálogos: sin systems no hay cascada, sin functionalities no hay qué elegir.
  const canBrowseExternalCatalog =
    isOrgAdmin ||
    (hasAnyPermission(['external_system:l', 'external_system:r']) &&
      hasAnyPermission(['external_functionality:l', 'external_functionality:r']))
  const canImportFromExternal = canCreateAsset && canBrowseExternalCatalog
  const hasAnyCreatePermission = canCreateAsset || canCreateFolder

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
                {canImportFromExternal && (
                  <DropdownMenuItem
                    onSelect={() => {
                      setTimeout(() => handleImportAssetFromExternal(), 0)
                    }}
                    className="hover:cursor-pointer"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('knowledge.importAssetFromExternal')}
                  </DropdownMenuItem>
                )}
                {canCreateAsset && (
                  <DropdownMenuItem
                    onSelect={() => {
                      setTimeout(() => handleImportConfig(), 0)
                    }}
                    className="hover:cursor-pointer"
                  >
                    <FileJson className="mr-2 h-4 w-4" />
                    {t('knowledge.importConfig')}
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
                {canCreateGroupFolder && (
                  <DropdownMenuItem
                    onSelect={() => {
                      setTimeout(() => handleCreateGroupFolder(), 0)
                    }}
                    className="hover:cursor-pointer"
                  >
                    <FolderKanban className="mr-2 h-4 w-4" />
                    {t('knowledge.newGroupFolder')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
  const { fileTreeRef, pendingFocusAssetIdRef, revealedNodeId, handleCreateAsset, handleImportAsset, handleImportAssetFromExternal, handleCreateFolder, handleShareFolder, handleDeleteFolder, handleEditFolder, handleDeleteDocument, handleEditDocument, handleOpenAssetLifecycle, committedSearch, rootPage, rootPageSize, setHasNextRootPage } = useNavKnowledge()
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

  // Refs so handleLoadChildren callback stays stable while always reading latest values
  const rootPageRef = React.useRef(rootPage)
  rootPageRef.current = rootPage
  const rootPageSizeRef = React.useRef(rootPageSize)
  rootPageSizeRef.current = rootPageSize

  const [searchResults, setSearchResults] = React.useState<FileNode[]>([])
  const [searchMatchIds, setSearchMatchIds] = React.useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = React.useState(false)

  React.useEffect(() => {
    if (!committedSearch || !selectedOrganizationId || !canListLibrary) {
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
  }, [committedSearch, selectedOrganizationId, canListLibrary])

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
      // Sin permiso de listar assets ni carpetas no se pega al backend.
      if (!canListLibrary) return []

      try {
        const isRoot = folderId === null
        const focusAssetId = isRoot ? (pendingFocusAssetIdRef.current ?? activeAssetIdRef.current) : null
        // Consumo único — no debe reusarse en refrescos posteriores no
        // relacionados, ni siquiera si esta carga falla.
        if (isRoot && pendingFocusAssetIdRef.current) pendingFocusAssetIdRef.current = null
        // Tracks whether the focused-tree branch actually ran. Starts optimistic
        // and gets demoted to false if the focus asset turns out to be invalid
        // (stale id, deleted asset, or leftover from another organization).
        let focusedRootLoad = isRoot && !!focusAssetId

        let content: LibraryContent
        if (focusedRootLoad) {
          try {
            content = await getLibraryContent(
              selectedOrganizationId,
              undefined,
              rootPageRef.current,
              rootPageSizeRef.current,
              undefined,
              undefined,
              focusAssetId!,
            )
          } catch (focusError) {
            if (!ApiError.isApiError(focusError) || focusError.statusCode !== 404) {
              throw focusError
            }
            // The focused asset doesn't exist / isn't reachable in this org
            // (e.g. leftover id from a previous org, or a deleted document).
            // That's a focus failure, not a folder-load failure — fall back to
            // a normal root load instead of emptying the whole tree.
            content = await getLibraryContent(
              selectedOrganizationId,
              undefined,
              rootPageRef.current,
              rootPageSizeRef.current,
            )
            focusedRootLoad = false
          }
        } else if (isRoot) {
          content = await getLibraryContent(
            selectedOrganizationId,
            undefined,
            rootPageRef.current,
            rootPageSizeRef.current,
          )
        } else {
          content = await getLibraryContent(selectedOrganizationId, folderId!)
        }

        if (isRoot) {
          setHasNextRootPage(content.has_next)
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
          if (focusedRootLoad) {
            content.folders.forEach((f) => newMap.set(f.id, f.parent_folder_id))
            content.assets.forEach((a) => newMap.set(a.id, a.folder_id))
          } else {
            [...content.folders.map(f => f.id), ...content.assets.map(a => a.id)]
              .forEach((id) => newMap.set(id, folderId))
          }
          return newMap
        })

        if (focusedRootLoad) {
          return buildFocusedTree(content)
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
        }))

        const assetNodes: FileNode[] = (content.assets ?? []).map((item) => ({
          id: item.id,
          name: item.name,
          type: 'document',
          document_type: item.document_type,
          access_levels: item.access_levels,
        }))

        return [...folderNodes, ...assetNodes]
      } catch (error) {
        logger.error("Error loading folder content:", error)
        if (ApiError.isApiError(error) && (error.statusCode === 404 || error.code === 'FOLDER_NOT_FOUND')) {
          toast.error(t('knowledge.errors.folderNotAccessible'))
        } else {
          toast.error(t('knowledge.errors.folderLoadError'))
        }
        return []
      }
    },
    [selectedOrganizationId, t, canListLibrary]
  )

  const handleRefreshTree = useCallback(
    () => handleLoadChildren(null),
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
        fileTreeRef.current?.refresh()
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
        fileTreeRef.current?.refresh()
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
      // Compartir accesos por rol aplica a Global/Forms/Área y a carpetas grupales custom de raíz.
      show: (node) =>
        node.type === "folder" &&
        (node.folder_type === 'global' || node.folder_type === 'forms' || node.folder_type === 'area' || !!node.isRootGroup) &&
        canAccessRoleFolders,
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
          onRefresh={handleRefreshTree}
          onFileClick={handleFileClick}
          onMoveFolder={handleMoveFolder}
          onMoveFile={handleMoveFile}
          canDragNode={canDragNode}
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
          preserveExpandedOnRefresh={!activeAssetId}
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
