"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { Settings2, Copy, Trash2 } from "lucide-react"
import { usePageAccess } from "@/hooks/usePageAccess"
import { type AssetTypeWithRoles } from "@/services/asset-types"
import { useAssetTypesWithRoles, useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { useDocumentTypes, documentTypeQueryKeys } from "@/hooks/useDocumentTypes"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useTag } from "@/hooks/useTags"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { HuemulTagChip } from "@/huemul/components/huemul-tag-chip"
import type { CanvasNodeAction } from "@/types/document-type-relationships"

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
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"

const RELATIONSHIP_PAGE_SIZE = 100

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
    tagsAssetType: null,
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
  // El sheet de configuración agrupa general + plantillas + ciclo de vida:
  // basta con poder abrir uno de esos tabs.
  const canConfigureDocumentType = canUpdateDocumentType || canManageTemplates || canManageLifecycle
  // canManageTags (tag:u) se resuelve dentro de AssetTypePageDialogs, que ya
  // llama a usePageAccess('asset-types') por su cuenta para montar el sheet.
  const canViewTags = can('viewTags')

  // Fetch asset types and mutations - solo si tiene permisos
  const { data: assetTypesResponse, isLoading, isFetching, error } = useAssetTypesWithRoles(page, pageSize, canListDocumentTypes, state.searchTerm || undefined, tagId)
  const assetTypeMutations = useAssetTypeMutations()

  // Fetch document types for the relationship canvas
  const { data: docTypesResponse, isLoading: isLoadingDocTypes, isFetching: isFetchingDocTypes } = useDocumentTypes({
    search: relSearch || undefined,
    enabled: canListDocumentTypes && viewMode === 'relationships',
  })
  const documentTypes = docTypesResponse?.data ?? []

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!assetTypesResponse,
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

  const rawAssetTypes = assetTypesResponse?.data || []
  const effectivePageSize = assetTypesResponse?.page_size || pageSize
  const assetTypes = pinnedNewAssetType
    ? [
        rawAssetTypes.find((a) => a.document_type_id === pinnedNewAssetType.document_type_id) ?? pinnedNewAssetType,
        ...rawAssetTypes.filter((a) => a.document_type_id !== pinnedNewAssetType.document_type_id),
      ].slice(0, effectivePageSize)
    : rawAssetTypes

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    setPinnedNewAssetType(null)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['asset-types', 'list-with-roles'] }),
        queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.all }),
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

  const handleViewTags = (assetType: AssetTypeWithRoles) => {
    updateState({ tagsAssetType: assetType })
  }

  const relTotalItems = documentTypes.length
  const relHasNext = relPage * RELATIONSHIP_PAGE_SIZE < relTotalItems
  const relHasPrevious = relPage > 1

  const handleRelSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setRelSearch(relSearchInput)
    setRelPage(1)
  }

  return (
    <>
      <HuemulPageLayout
        key={viewMode}
        header={
          <>
            <AssetTypePageHeader
              assetTypeCount={assetTypes.length}
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
            ) : assetTypes.length === 0 ? (
              <AssetTypeContentEmptyState
                type="empty"
                onCreateFirst={canCreateDocumentType ? () => updateState({ showCreateDialog: true }) : undefined}
              />
            ) : (
              <AssetTypeTable
                assetTypes={assetTypes}
                onConfigureAssetType={handleConfigureAssetType}
                onDeleteAssetType={handleDeleteAssetType}
                onCloneAssetType={handleCloneAssetType}
                onViewRelationships={handleViewRelationships}
                onViewTags={handleViewTags}
                canConfigure={canConfigureDocumentType}
                canDelete={canDeleteDocumentType}
                canViewRelationships={canListRelationships}
                canClone={canCloneDocumentType}
                canViewTags={canViewTags}
                isLoading={isTableLoading}
                isFetching={isTableFetching}
                selectedIds={selectedExportIds}
                onSelectionChange={setSelectedExportIds}
                pagination={{
                  page: assetTypesResponse?.page || page,
                  pageSize: assetTypesResponse?.page_size || pageSize,
                  hasNext: assetTypesResponse?.has_next,
                  hasPrevious: (assetTypesResponse?.page || page) > 1,
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
            header: {
              content: (
                <div className="px-3 py-2 border-b bg-muted/20">
                  <form onSubmit={handleRelSearchSubmit}>
                    <HuemulField
                      type="text"
                      value={relSearchInput}
                      onChange={(v) => setRelSearchInput(v as string)}
                      placeholder={t('header.searchPlaceholder')}
                      className="gap-0"
                      inputClassName="h-8 text-xs"
                    />
                  </form>
                </div>
              ),
            },
            content: (
              <AssetTypeSidebar
                items={documentTypes}
                isLoading={isLoadingDocTypes}
                isFetching={isFetchingDocTypes}
                page={relPage}
                pageSize={RELATIONSHIP_PAGE_SIZE}
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
