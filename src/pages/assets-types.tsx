"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Settings2, Copy, Trash2 } from "lucide-react"
import { usePageAccess } from "@/hooks/usePageAccess"
import { type AssetTypeWithRoles } from "@/services/asset-types"
import { useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { useDocumentTypes, documentTypeQueryKeys } from "@/hooks/useDocumentTypes"
import { useDocumentTypeFolders, useDocumentTypeFolderMutations, documentTypeFolderQueryKeys } from "@/hooks/useDocumentTypeFolders"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useTag, tagsQueryKeys } from "@/hooks/useTags"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { HuemulTagChip } from "@/huemul/components/huemul-tag-chip"
import type { CanvasNodeAction } from "@/types/document-type-relationships"
import type { DocumentType } from "@/types/document-types"
import type { DocumentTypeFolder } from "@/types/document-type-folders"
import type { Tag } from "@/types/tags"
import type { HuemulTableFolder } from "@/huemul/components/huemul-table"

// Components
import {
  AssetTypeTable,
  AssetTypePageHeader,
  AssetTypePageSkeleton,
  AssetTypePageEmptyState,
  AssetTypePageDialogs,
  AssetTypeContentEmptyState,
  type AssetTypePageState
} from "@/components/assets-types"
import { AssetTypeSidebar, RelationshipsCanvas } from "@/components/document-type-relationships"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"

const RELATIONSHIP_PAGE_SIZE = 100

// Pantalla de administración con volumen bajo: alcanza con traer todo (carpetas
// y tipos de documento) de una vez y agrupar/paginar en cliente para poder
// mostrar el árbol carpeta → tipos sin que la paginación separe una carpeta
// de su contenido.
const TREE_FETCH_PAGE_SIZE = 1000

function toAssetTypeWithRoles(dt: DocumentType): AssetTypeWithRoles {
  return {
    document_type_id: dt.id,
    document_type_name: dt.name,
    document_type_color: dt.color,
    document_type_created_date: dt.created_at,
    document_count: dt.document_count,
    roles: [],
    document_type_folder_id: dt.document_type_folder_id,
  }
}

type RootItem =
  | { kind: 'folder'; folder: DocumentTypeFolder }
  | { kind: 'type'; dt: DocumentType }

export default function AssetTypesPage() {
  const { t } = useTranslation('asset-types')
  const [state, setState] = useState<AssetTypePageState>({
    searchTerm: "",
    showCreateDialog: false,
    configAssetType: null,
    deletingAssetType: null,
    cloningAssetType: null,
    viewRelationshipsAssetType: null,
    showExportDialog: false,
    showImportSheet: false,
    deletingFolder: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [viewMode, setViewMode] = useState<'table' | 'relationships'>('table')
  const [relSearchInput, setRelSearchInput] = useState("")
  const [relSearch, setRelSearch] = useState("")
  const [relPage, setRelPage] = useState(1)
  const [selectedExportIds, setSelectedExportIds] = useState<Set<string>>(new Set())
  const [pinnedNewAssetType, setPinnedNewAssetType] = useState<AssetTypeWithRoles | null>(null)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set())
  const [searchParams, setSearchParams] = useSearchParams()
  const tagId = searchParams.get("tag_id") || undefined
  const { data: activeTag } = useTag(tagId ?? "", !!tagId)
  const clearTagFilter = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete("tag_id")
      return next
    })
    setPage(1)
  }

  // Permisos
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess('asset-types')
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()

  // Permisos específicos
  const canListDocumentTypes = can('listAssetTypes')
  const canCreateDocumentType = can('createAssetType')
  const canUpdateDocumentType = can('updateAssetType')
  const canDeleteDocumentType = can('deleteAssetType')
  const canExportDocumentTypes = can('exportAssetTypes')
  const canImportDocumentTypes = can('importAssetTypes')
  const canListRelationships = can('listRelationships')
  const canManageLifecycle = can('manageLifecycle')
  const canManageTemplates = can('manageLinkedTemplates')
  const canCloneDocumentType = can('cloneAssetType')
  const canCreateFolder = can('createFolder')
  const canManageFolders = can('updateFolder')
  const canDeleteFolder = can('deleteFolder')
  const canViewTags = can('viewTags')
  const canManageTags = can('manageTags')
  // El sheet de configuración agrupa general + plantillas + ciclo de vida:
  // basta con poder abrir uno de esos tabs.
  const canConfigureDocumentType = canUpdateDocumentType || canManageTemplates || canManageLifecycle

  // Fetch document type folders + document types (todo, sin paginar en el
  // servidor) para poder armar el árbol carpeta → tipos.
  const { data: foldersResponse, isLoading: isLoadingFolders, isFetching: isFetchingFolders } = useDocumentTypeFolders({
    page_size: TREE_FETCH_PAGE_SIZE,
    enabled: canListDocumentTypes,
  })
  const { data: typesResponse, isLoading: isLoadingTypes, isFetching: isFetchingTypes, error } = useDocumentTypes({
    page_size: TREE_FETCH_PAGE_SIZE,
    search: state.searchTerm || undefined,
    tag_id: tagId,
    // Alimenta la columna de etiquetas de la tabla sin un GET por fila.
    include_tags: canViewTags,
    enabled: canListDocumentTypes,
  })
  const folderMutations = useDocumentTypeFolderMutations()
  const assetTypeMutations = useAssetTypeMutations()

  // Fetch document types for the relationship canvas
  const { data: docTypesResponse, isLoading: isLoadingDocTypes, isFetching: isFetchingDocTypes } = useDocumentTypes({
    search: relSearch || undefined,
    enabled: canListDocumentTypes && viewMode === 'relationships',
  })
  const documentTypes = docTypesResponse?.data ?? []

  const isLoading = isLoadingFolders || isLoadingTypes
  const isFetching = isFetchingFolders || isFetchingTypes
  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!typesResponse && !!foldersResponse,
  })

  // State update helpers (defined early so nodeActions can use them)
  const updateState = (updates: Partial<AssetTypePageState>) => {
    setState((prev: AssetTypePageState) => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof AssetTypePageState) => {
    setState((prev: AssetTypePageState) => ({ ...prev, [dialog]: null }))
  }

  // Node actions for relationship canvas
  function toMinimalAssetType(id: string, name: string, color: string): AssetTypeWithRoles {
    return {
      document_type_id: id,
      document_type_name: name,
      document_type_color: color,
      document_type_created_date: "",
      document_count: 0,
      roles: [],
    }
  }

  const nodeActions: CanvasNodeAction[] = [
    ...(canConfigureDocumentType ? [{
      key: "configure",
      label: t('actions.configureAssetType'),
      icon: Settings2,
      onClick: (nodeId: string) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        updateState({ configAssetType: toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8") })
      },
    }] : []),
    ...(canCloneDocumentType ? [{
      key: "clone",
      label: t('actions.cloneAssetType'),
      icon: Copy,
      onClick: (nodeId: string) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        updateState({ cloningAssetType: toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8") })
      },
    }] : []),
    ...(canDeleteDocumentType ? [{
      key: "delete",
      label: t('actions.deleteAssetType'),
      icon: Trash2,
      onClick: (nodeId: string) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        updateState({ deletingAssetType: toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8") })
      },
      destructive: true,
      separator: true,
    }] : []),
  ]

  // ── Árbol carpeta → tipos de documento ─────────────────────────────────────
  const folders = foldersResponse?.data ?? []
  const allTypes = typesResponse?.data ?? []
  const folderById = new Map(folders.map((f) => [f.id, f]))

  const typesByFolder = new Map<string, DocumentType[]>()
  const rootTypes: DocumentType[] = []
  for (const dt of allTypes) {
    if (dt.document_type_folder_id && folderById.has(dt.document_type_folder_id)) {
      const list = typesByFolder.get(dt.document_type_folder_id) ?? []
      list.push(dt)
      typesByFolder.set(dt.document_type_folder_id, list)
    } else {
      rootTypes.push(dt)
    }
  }

  const sortedFolders = [...folders].sort((a, b) => a.name.localeCompare(b.name))
  const sortedRootTypes = [...rootTypes].sort((a, b) => a.name.localeCompare(b.name))

  // Con búsqueda activa, auto-expandir las carpetas que tengan algún match —
  // si no, los resultados quedan escondidos dentro de una carpeta colapsada.
  useEffect(() => {
    if (!state.searchTerm) return
    setExpandedFolderIds((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const folder of folders) {
        if ((typesByFolder.get(folder.id)?.length ?? 0) > 0 && !next.has(folder.id)) {
          next.add(folder.id)
          changed = true
        }
      }
      return changed ? next : prev
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.searchTerm, allTypes, folders])

  const rootItems: RootItem[] = [
    ...sortedFolders.map((folder) => ({ kind: 'folder' as const, folder })),
    ...sortedRootTypes.map((dt) => ({ kind: 'type' as const, dt })),
  ]
  const totalRootItems = rootItems.length
  const pageStart = (page - 1) * pageSize
  let pagedRootItems = rootItems.slice(pageStart, pageStart + pageSize)
  const hasNextPage = pageStart + pageSize < totalRootItems
  const hasPreviousPage = page > 1

  // Fija el tipo de documento recién creado al tope de la página actual.
  if (pinnedNewAssetType) {
    const pinnedId = pinnedNewAssetType.document_type_id
    const existing = allTypes.find((dt) => dt.id === pinnedId)
    const pinnedDt: DocumentType = existing ?? {
      id: pinnedId,
      name: pinnedNewAssetType.document_type_name,
      color: pinnedNewAssetType.document_type_color,
      requires_iso_strict_versioning: true,
      final_lifecycle_stage: "publish",
      created_at: pinnedNewAssetType.document_type_created_date || new Date().toISOString(),
      updated_at: pinnedNewAssetType.document_type_created_date || new Date().toISOString(),
      document_count: pinnedNewAssetType.document_count,
      document_type_folder_id: null,
    }
    pagedRootItems = [
      { kind: 'type', dt: pinnedDt },
      ...pagedRootItems.filter((item) => !(item.kind === 'type' && item.dt.id === pinnedId)),
    ]
  }

  // `HuemulTable` arma el árbol (carpeta → hijos) a partir de `data` + `folders` — la
  // página solo necesita entregarle los tipos de raíz de esta página, más los hijos de
  // cada carpeta visible que esté expandida (los de una carpeta colapsada no hace falta
  // mandarlos: el conteo del badge viene de `folderItemCounts`, no de `data`).
  const pageFolders: DocumentTypeFolder[] = pagedRootItems
    .filter((item): item is Extract<RootItem, { kind: 'folder' }> => item.kind === 'folder')
    .map((item) => item.folder)
  const pageRootTypes: DocumentType[] = pagedRootItems
    .filter((item): item is Extract<RootItem, { kind: 'type' }> => item.kind === 'type')
    .map((item) => item.dt)

  const folderItemCounts: Record<string, number> = {}
  for (const folder of pageFolders) folderItemCounts[folder.id] = typesByFolder.get(folder.id)?.length ?? 0

  // Etiquetas ya traídas por el listado (`include_tags`): siembran el picker de
  // cada fila para que no dispare su propio GET.
  const initialTags: Record<string, Tag[]> = {}
  for (const dt of allTypes) if (dt.tags) initialTags[dt.id] = dt.tags

  const data: AssetTypeWithRoles[] = [
    ...pageRootTypes.map(toAssetTypeWithRoles),
    ...pageFolders.flatMap((folder) =>
      expandedFolderIds.has(folder.id)
        ? [...(typesByFolder.get(folder.id) ?? [])].sort((a, b) => a.name.localeCompare(b.name)).map(toAssetTypeWithRoles)
        : []
    ),
  ]

  // Loading permissions check
  if (isLoadingPermissions) {
    return <AssetTypePageSkeleton />
  }

  // Access check
  if (!canAccessPage) {
    return <AssetTypePageEmptyState type="access-denied" />
  }

  // Loading state
  if (showPageLoader) {
    return <AssetTypePageSkeleton />
  }

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    setPinnedNewAssetType(null)
    // Las etiquetas por objeto se borran en vez de invalidarse: el listado de
    // tipos ya vuelve con `include_tags`, así que el siguiente render las
    // siembra de nuevo (invalidarlas dispararía un GET por fila).
    queryClient.removeQueries({ queryKey: tagsQueryKeys.byObject() })
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: documentTypeFolderQueryKeys.listBase() }),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fija el asset type recién creado al tope de la página actual (sin cambiar de página)
  const handleAssetTypeCreated = (created: { id: string; name: string; color: string; created_at?: string; document_count?: number }) => {
    setPinnedNewAssetType({
      document_type_id: created.id,
      document_type_name: created.name,
      document_type_color: created.color,
      document_type_created_date: created.created_at ?? "",
      document_count: created.document_count ?? 0,
      roles: [],
    })
  }

  // Asset type action handlers
  const handleConfigureAssetType = (assetType: AssetTypeWithRoles) => {
    updateState({ configAssetType: assetType })
  }

  const handleDeleteAssetType = (assetType: AssetTypeWithRoles) => {
    updateState({ deletingAssetType: assetType })
  }

  const handleCloneAssetType = (assetType: AssetTypeWithRoles) => {
    updateState({ cloningAssetType: assetType })
  }

  const handleViewRelationships = (assetType: AssetTypeWithRoles) => {
    updateState({ viewRelationshipsAssetType: assetType })
  }

  // Folder handlers
  const handleCreateFolder = (name: string) => {
    return folderMutations.createFolder.mutateAsync({ name }).then((folder): HuemulTableFolder => {
      // Sin meta.successMessage en la mutación (ver useDocumentTypeFolders.ts): el toast
      // con "Deshacer" es de acá, no del genérico de MutationCache — el snapshot para
      // deshacer es la operación inversa (borrar la carpeta recién creada), capturado en
      // este cierre y no en una ref compartida (bug de undo que se repetía en el
      // prototipo de referencia — dos creaciones seguidas deshacían siempre la última).
      toast.success(t('folders.createdToast', { name: folder.name }), {
        duration: 4000,
        action: {
          label: t('common:undo'),
          onClick: () => { folderMutations.deleteFolder.mutate(folder.id) },
        },
      })
      return { id: folder.id, name: folder.name }
    })
  }

  const handleRenameFolder = async (folderId: string, name: string) => {
    await folderMutations.updateFolder.mutateAsync({ id: folderId, data: { name } })
  }

  const handleDeleteFolderRequest = (folder: DocumentTypeFolder) => {
    updateState({ deletingFolder: folder })
  }

  // Cubre drag & drop y el menú "Mover a carpeta"/"Quitar de la carpeta" de la fila:
  // mover a una carpeta usa `assignDocumentTypes`, sacarlo (folderId null) usa
  // `removeDocumentType` con la carpeta de origen. El toast de éxito lleva "Deshacer",
  // que dispara la operación inversa exacta — capturada acá, no en un estado compartido.
  const handleMoveAssetType = (assetTypeId: string, folderId: string | null) => {
    const dt = allTypes.find((d) => d.id === assetTypeId)
    const previousFolderId = dt?.document_type_folder_id ?? null
    if (previousFolderId === folderId) return
    const name = dt?.name ?? ''

    const performMove = (toFolderId: string | null, fromFolderId: string | null) =>
      toFolderId === null
        ? folderMutations.removeDocumentType.mutateAsync({ folderId: fromFolderId as string, documentTypeId: assetTypeId })
        : folderMutations.assignDocumentTypes.mutateAsync({ folderId: toFolderId, data: { document_type_ids: [assetTypeId] } })

    performMove(folderId, previousFolderId)
      .then(() => {
        const message = folderId
          ? t('folders.movedToast', { name, folder: folderById.get(folderId)?.name ?? '' })
          : t('folders.removedToast', { name })
        toast.success(message, {
          duration: 6000,
          action: {
            label: t('common:undo'),
            onClick: () => {
              performMove(previousFolderId, folderId).catch(() => toast.error(t('folders.moveError')))
            },
          },
        })
      })
      .catch(() => toast.error(t('folders.moveError')))
  }

  const relTotalItems = documentTypes.length
  const relHasNext = relPage * RELATIONSHIP_PAGE_SIZE < relTotalItems
  const relHasPrevious = relPage > 1

  const handleRelSearchCommit = (value: string) => {
    setRelSearch(value)
    setRelPage(1)
  }

  return (
    <>
      <HuemulPageLayout
        key={viewMode}
        header={
          <>
            <AssetTypePageHeader
              assetTypeCount={totalRootItems}
              onCreateAssetType={() => updateState({ showCreateDialog: true })}
              onRefresh={handleRefresh}
              isLoading={isRefreshing || isFetching || isFetchingDocTypes}
              hasError={!!error}
              searchTerm={state.searchTerm}
              onSearchChange={(value) => {
                updateState({ searchTerm: value })
                setPage(1)
                setPinnedNewAssetType(null)
              }}
              canCreate={canCreateDocumentType}
              viewMode={viewMode}
              onViewModeChange={canListRelationships ? setViewMode : undefined}
              onExport={() => updateState({ showExportDialog: true })}
              onImport={() => updateState({ showImportSheet: true })}
              canExport={canExportDocumentTypes}
              canImport={canImportDocumentTypes}
              exportSelectedCount={selectedExportIds.size}
            />
            {activeTag && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-muted-foreground">{t('filters.filteredByTag')}</span>
                <HuemulTagChip label={activeTag.name} color={activeTag.color} size="sm" onRemove={clearTagFilter} />
              </div>
            )}
          </>
        }
        headerClassName="p-6 md:p-8 pb-0 md:pb-0"
        columns={viewMode !== 'relationships' || !canListRelationships ? [
          {
            content: error ? (
              <AssetTypeContentEmptyState
                type="error"
                message={error.message}
                onRetry={handleRefresh}
              />
            ) : totalRootItems === 0 ? (
              <AssetTypeContentEmptyState
                type="empty"
                onCreateFirst={canCreateDocumentType ? () => updateState({ showCreateDialog: true }) : undefined}
              />
            ) : (
              <AssetTypeTable
                data={data}
                folders={pageFolders}
                folderItemCounts={folderItemCounts}
                expandedFolderIds={expandedFolderIds}
                onExpandedFolderIdsChange={setExpandedFolderIds}
                onConfigureAssetType={handleConfigureAssetType}
                onDeleteAssetType={handleDeleteAssetType}
                onCloneAssetType={handleCloneAssetType}
                onViewRelationships={handleViewRelationships}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolderRequest={handleDeleteFolderRequest}
                onMoveAssetType={handleMoveAssetType}
                canConfigure={canConfigureDocumentType}
                canDelete={canDeleteDocumentType}
                canViewRelationships={canListRelationships}
                canClone={canCloneDocumentType}
                canManageFolders={canManageFolders}
                canCreateFolder={canCreateFolder}
                canDeleteFolder={canDeleteFolder}
                canViewTags={canViewTags}
                canManageTags={canManageTags}
                initialTags={initialTags}
                isLoading={isTableLoading}
                isFetching={isTableFetching}
                selectedIds={selectedExportIds}
                onSelectionChange={setSelectedExportIds}
                pagination={{
                  page,
                  pageSize,
                  totalItems: totalRootItems,
                  hasNext: hasNextPage,
                  hasPrevious: hasPreviousPage,
                  onPageChange: (newPage: number) => {
                    setPinnedNewAssetType(null)
                    setPage(newPage)
                  },
                  onPageSizeChange: (newPageSize: number) => {
                    setPinnedNewAssetType(null)
                    setPageSize(newPageSize)
                    setPage(1)
                  },
                  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS
                }}
              />
            ),
            className: "p-6 md:p-8 pt-0 md:pt-0",
          },
        ] : [
          {
            content: (
              <AssetTypeSidebar
                items={documentTypes}
                isLoading={isLoadingDocTypes}
                page={relPage}
                pageSize={RELATIONSHIP_PAGE_SIZE}
                search={relSearchInput}
                onSearchChange={setRelSearchInput}
                onSearchCommit={handleRelSearchCommit}
                searchPlaceholder={t('header.searchPlaceholder')}
              />
            ),
            defaultSize: 20,
            minSize: 15,
            maxSize: 35,
            className: "overflow-hidden",
            footer: {
              content: (
                <HuemulPagination
                  page={relPage}
                  pageSize={RELATIONSHIP_PAGE_SIZE}
                  hasNext={relHasNext}
                  hasPrevious={relHasPrevious}
                  onPageChange={setRelPage}
                />
              ),
            },
          },
          {
            content: (
              <RelationshipsCanvas
                organizationId={selectedOrganizationId ?? ""}
                documentTypes={documentTypes}
                nodeActions={nodeActions}
              />
            ),
            defaultSize: 80,
            minSize: 50,
            className: "overflow-hidden",
          },
        ]}
      />

      <AssetTypePageDialogs
        state={state}
        onCloseDialog={closeDialog}
        onUpdateState={updateState}
        assetTypeMutations={assetTypeMutations}
        onImportSuccess={handleRefresh}
        exportSelectedIds={[...selectedExportIds]}
        onExported={() => setSelectedExportIds(new Set())}
        onAssetTypeCreated={handleAssetTypeCreated}
      />
    </>
  )
}
