"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Edit2, Activity, Copy, Trash2 } from "lucide-react"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { type AssetTypeWithRoles } from "@/services/asset-types"
import { useAssetTypesWithRoles, useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { useDocumentTypes, documentTypeQueryKeys } from "@/hooks/useDocumentTypes"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
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
    editingAssetType: null,
    showCreateDialog: false,
    deletingAssetType: null,
    cloningAssetType: null,
    rolePermissionsAssetType: null,
    lifecycleAssetType: null,
    viewRelationshipsAssetType: null,
    templatesAssetType: null,
    showExportDialog: false,
    showImportSheet: false,
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

  // Permisos
  const { isRootAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  
  // Permisos específicos
  const canListDocumentTypes = isRootAdmin || hasAnyPermission(['asset_type:l', 'asset_type:r'])
  const canCreateDocumentType = isRootAdmin || hasPermission('asset_type:c')
  const canUpdateDocumentType = isRootAdmin || hasPermission('asset_type:u')
  const canDeleteDocumentType = isRootAdmin || hasPermission('asset_type:d')
  const canExportDocumentTypes = isRootAdmin || hasPermission('asset_type:r')
  const canImportDocumentTypes = isRootAdmin || (hasPermission('asset_type:c') && hasPermission('asset_type:u'))
  const canListRelationships = isRootAdmin || hasAnyPermission(['asset_type_relationship:l', 'asset_type_relationship:r'])

  // Fetch asset types and mutations - solo si tiene permisos
  const { data: assetTypesResponse, isLoading, isFetching, error } = useAssetTypesWithRoles(page, pageSize, canListDocumentTypes, state.searchTerm || undefined)
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
    ...(canUpdateDocumentType ? [{
      key: "edit",
      label: t('actions.editAssetType'),
      icon: Edit2,
      onClick: (nodeId: string) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        updateState({ editingAssetType: toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8") })
      },
    }] : []),
    ...(canUpdateDocumentType ? [{
      key: "lifecycle",
      label: t('actions.lifecycle'),
      icon: Activity,
      onClick: (nodeId: string) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        updateState({ lifecycleAssetType: toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8") })
      },
    }] : []),
    ...(canCreateDocumentType ? [{
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
  if (!canListDocumentTypes) {
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
  const handleEditAssetType = (assetType: AssetTypeWithRoles) => {
    updateState({ editingAssetType: assetType })
  }

  const handleDeleteAssetType = (assetType: AssetTypeWithRoles) => {
    updateState({ deletingAssetType: assetType })
  }

  const handleCloneAssetType = (assetType: AssetTypeWithRoles) => {
    updateState({ cloningAssetType: assetType })
  }

  const handleLifecycle = (assetType: AssetTypeWithRoles) => {
    updateState({ lifecycleAssetType: assetType })
  }

  const handleViewRelationships = (assetType: AssetTypeWithRoles) => {
    updateState({ viewRelationshipsAssetType: assetType })
  }

  const handleManageTemplates = (assetType: AssetTypeWithRoles) => {
    updateState({ templatesAssetType: assetType })
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
                onCreateFirst={() => updateState({ showCreateDialog: true })}
              />
            ) : (
              <AssetTypeTable
                assetTypes={assetTypes}
                onEditAssetType={handleEditAssetType}
                onDeleteAssetType={handleDeleteAssetType}
                onCloneAssetType={handleCloneAssetType}
                onLifecycle={handleLifecycle}
                onViewRelationships={handleViewRelationships}
                onManageTemplates={handleManageTemplates}
                canUpdate={canUpdateDocumentType}
                canDelete={canDeleteDocumentType}
                canViewRelationships={canListRelationships}
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
