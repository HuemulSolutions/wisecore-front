"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { type AssetTypeWithRoles } from "@/services/asset-types"
import { useAssetTypesWithRoles, useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// Components
import {
  AssetTypeTable,
  AssetTypePageHeader,
  AssetTypeFilters,
  AssetTypePageSkeleton,
  AssetTypePageEmptyState,
  AssetTypePageDialogs,
  AssetTypeContentEmptyState,
  type AssetTypePageState
} from "@/components/asset-types"

export default function AssetTypesPage() {
  const [state, setState] = useState<AssetTypePageState>({
    searchTerm: "",
    selectedAssetTypes: new Set(),
    editingAssetType: null,
    showCreateDialog: false,
    deletingAssetType: null,
    rolePermissionsAssetType: null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get auth context
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  // Fetch asset types and mutations
  const { data: assetTypesResponse, isLoading, error } = useAssetTypesWithRoles()
  const assetTypeMutations = useAssetTypeMutations()

  // Access check
  if (!currentUser?.is_root_admin) {
    return <AssetTypePageEmptyState type="access-denied" />
  }

  // Loading state
  if (isLoading) {
    return <AssetTypePageSkeleton />
  }

  const assetTypes = assetTypesResponse?.data || []

  const filteredAssetTypes = assetTypes.filter((assetType: AssetTypeWithRoles) => {
    const matchesSearch = assetType.document_type_name
      .toLowerCase()
      .includes(state.searchTerm.toLowerCase())

    return matchesSearch
  })

  // State update helpers
  const updateState = (updates: Partial<AssetTypePageState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof AssetTypePageState) => {
    setState(prev => ({ ...prev, [dialog]: null }))
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

  // Asset type selection handlers
  const handleAssetTypeSelection = (assetTypeId: string) => {
    const newSelection = new Set(state.selectedAssetTypes)
    if (newSelection.has(assetTypeId)) {
      newSelection.delete(assetTypeId)
    } else {
      newSelection.add(assetTypeId)
    }
    updateState({ selectedAssetTypes: newSelection })
  }

  // Asset type action handlers
  const handleEditAssetType = async (assetType: AssetTypeWithRoles) => {
    updateState({ editingAssetType: assetType })
  }

  const handleManagePermissions = async (assetType: AssetTypeWithRoles) => {
    updateState({ rolePermissionsAssetType: assetType })
  }

  const handleDeleteAssetType = async (assetType: AssetTypeWithRoles) => {
    updateState({ deletingAssetType: assetType })
  }

  const handleSelectAll = () => {
    if (state.selectedAssetTypes.size === filteredAssetTypes.length) {
      updateState({ selectedAssetTypes: new Set() })
    } else {
      updateState({ selectedAssetTypes: new Set(filteredAssetTypes.map((assetType: AssetTypeWithRoles) => assetType.document_type_id)) })
    }
  }

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="mx-auto">
        {/* Header */}
        <AssetTypePageHeader
          assetTypeCount={filteredAssetTypes.length}
          onCreateAssetType={() => updateState({ showCreateDialog: true })}
          onRefresh={handleRefresh}
          isLoading={isLoading || isRefreshing}
          hasError={!!error}
        />

        {/* Filters */}
        <AssetTypeFilters
          searchTerm={state.searchTerm}
          onSearchChange={(value) => updateState({ searchTerm: value })}
        />

        {/* Content Area - Table or Error */}
        {error ? (
          <AssetTypeContentEmptyState 
            type="error" 
            message={error.message} 
            onRetry={handleRefresh}
          />
        ) : filteredAssetTypes.length === 0 && assetTypes.length === 0 ? (
          <AssetTypeContentEmptyState 
            type="empty"
            onCreateFirst={() => updateState({ showCreateDialog: true })}
          />
        ) : (
          <AssetTypeTable
            assetTypes={filteredAssetTypes}
            selectedAssetTypes={state.selectedAssetTypes}
            onAssetTypeSelection={handleAssetTypeSelection}
            onSelectAll={handleSelectAll}
            onEditAssetType={handleEditAssetType}
            onManagePermissions={handleManagePermissions}
            onDeleteAssetType={handleDeleteAssetType}
            assetTypeMutations={assetTypeMutations}
          />
        )}

        {/* Dialogs */}
        <AssetTypePageDialogs
          state={state}
          onCloseDialog={closeDialog}
          onUpdateState={updateState}
          assetTypeMutations={assetTypeMutations}
        />
      </div>
    </div>
  )
}
