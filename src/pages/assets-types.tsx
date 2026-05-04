"use client"

import { useState } from "react"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { type AssetTypeWithRoles } from "@/services/asset-types"
import { useAssetTypesWithRoles, useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"

export default function AssetTypesPage() {
  const [state, setState] = useState<AssetTypePageState>({
    searchTerm: "",
    editingAssetType: null,
    showCreateDialog: false,
    deletingAssetType: null,
    rolePermissionsAssetType: null,
    lifecycleAssetType: null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Permisos
  const { isRootAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()
  
  // Permisos específicos
  const canListDocumentTypes = isRootAdmin || hasAnyPermission(['asset_type:l', 'asset_type:r'])
  const canCreateDocumentType = isRootAdmin || hasPermission('asset_type:c')
  const canUpdateDocumentType = isRootAdmin || hasPermission('asset_type:u')
  const canDeleteDocumentType = isRootAdmin || hasPermission('asset_type:d')
  
  // Fetch asset types and mutations - solo si tiene permisos
  const { data: assetTypesResponse, isLoading, isFetching, error } = useAssetTypesWithRoles(page, pageSize, canListDocumentTypes, state.searchTerm || undefined)
  const assetTypeMutations = useAssetTypeMutations()

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!assetTypesResponse,
  })

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

  const assetTypes = assetTypesResponse?.data || []

  // State update helpers
  const updateState = (updates: Partial<AssetTypePageState>) => {
    setState((prev: AssetTypePageState) => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof AssetTypePageState) => {
    setState((prev: AssetTypePageState) => ({ ...prev, [dialog]: null }))
  }

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ['asset-types', 'list-with-roles'] })
      toast.success('Data refreshed')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Asset type action handlers
  const handleEditAssetType = (assetType: AssetTypeWithRoles) => {
    updateState({ editingAssetType: assetType })
  }

  const handleDeleteAssetType = (assetType: AssetTypeWithRoles) => {
    updateState({ deletingAssetType: assetType })
  }

  const handleLifecycle = (assetType: AssetTypeWithRoles) => {
    updateState({ lifecycleAssetType: assetType })
  }

  return (
    <>
      <HuemulPageLayout
        header={
          <AssetTypePageHeader
            assetTypeCount={assetTypes.length}
            onCreateAssetType={() => updateState({ showCreateDialog: true })}
            onRefresh={handleRefresh}
            isLoading={isRefreshing}
            hasError={!!error}
            searchTerm={state.searchTerm}
            onSearchChange={(value) => {
              updateState({ searchTerm: value })
              setPage(1)
            }}
            canCreate={canCreateDocumentType}
          />
        }
        headerClassName="p-6 md:p-8 pb-0 md:pb-0"
        columns={[
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
                onLifecycle={handleLifecycle}
                canUpdate={canUpdateDocumentType}
                canDelete={canDeleteDocumentType}
                isLoading={isTableLoading}
                isFetching={isTableFetching}
                pagination={{
                  page: assetTypesResponse?.page || page,
                  pageSize: assetTypesResponse?.page_size || pageSize,
                  hasNext: assetTypesResponse?.has_next,
                  hasPrevious: (assetTypesResponse?.page || page) > 1,
                  onPageChange: (newPage: number) => setPage(newPage),
                  onPageSizeChange: (newPageSize: number) => {
                    setPageSize(newPageSize)
                    setPage(1)
                  },
                  pageSizeOptions: [10, 25, 50, 100, 250, 500, 1000]
                }}
              />
            ),
            className: "p-6 md:p-8 pt-0 md:pt-0",
          },
        ]}
      />

      <AssetTypePageDialogs
        state={state}
        onCloseDialog={closeDialog}
        onUpdateState={updateState}
        assetTypeMutations={assetTypeMutations}
      />
    </>
  )
}
