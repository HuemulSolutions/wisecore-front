"use client"

import { useState } from "react"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { type CustomField } from "@/types/custom-fields"
import { useCustomFields, useCustomFieldMutations } from "@/hooks/useCustomFields"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"

// Components
import {
  CustomFieldTable,
  CustomFieldPageHeader,
  CustomFieldPageSkeleton,
  CustomFieldPageEmptyState,
  CustomFieldPageDialogs,
  CustomFieldContentEmptyState,
  type CustomFieldPageState
} from "@/components/custom-fields"

export default function CustomFieldsPage() {
  const [state, setState] = useState<CustomFieldPageState>({
    searchTerm: "",
    editingCustomField: null,
    showCreateDialog: false,
    deletingCustomField: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Get permissions
  const { isRootAdmin, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()
  
  // Fetch custom fields and mutations - solo si es admin
  const { data: customFieldsResponse, isLoading, isFetching, error } = useCustomFields({ 
    page, 
    page_size: pageSize,
    search: state.searchTerm || undefined,
    enabled: isRootAdmin 
  })
  const customFieldMutations = useCustomFieldMutations()

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!customFieldsResponse,
  })

  // Loading state for permissions
  if (isLoadingPermissions) {
    return <CustomFieldPageSkeleton />
  }

  // Access check - only root admin
  if (!isRootAdmin) {
    return <CustomFieldPageEmptyState type="access-denied" />
  }

  // Loading state
  if (showPageLoader) {
    return <CustomFieldPageSkeleton />
  }

  const customFields = customFieldsResponse?.data || []
  const filteredCustomFields = customFields

  // State update helpers
  const updateState = (updates: Partial<CustomFieldPageState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof CustomFieldPageState) => {
    setState(prev => ({ ...prev, [dialog]: null }))
  }

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ['custom-fields'] })
      toast.success('Data refreshed')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Custom field action handlers
  const handleEditCustomField = (customField: CustomField) => {
    updateState({ editingCustomField: customField })
  }

  const handleDeleteCustomField = (customField: CustomField) => {
    updateState({ deletingCustomField: customField })
  }

  const handleClearFilters = () => {
    updateState({ searchTerm: "" })
  }

  return (
    <>
      <HuemulPageLayout
        header={
          <CustomFieldPageHeader
            customFieldCount={filteredCustomFields.length}
            onCreateCustomField={() => updateState({ showCreateDialog: true })}
            onRefresh={handleRefresh}
            isLoading={isRefreshing}
            searchTerm={state.searchTerm}
            onSearchChange={(value: string) => {
              updateState({ searchTerm: value })
              setPage(1)
            }}
            canManage={isRootAdmin}
          />
        }
        headerClassName="p-6 md:p-8 pb-0 md:pb-0"
        columns={[
          {
            content: error ? (
              <CustomFieldContentEmptyState 
                type="error" 
                message={error.message} 
                onRetry={handleRefresh}
              />
            ) : filteredCustomFields.length === 0 && customFields.length === 0 ? (
              <CustomFieldContentEmptyState 
                type="empty"
                onCreateFirst={() => updateState({ showCreateDialog: true })}
              />
            ) : filteredCustomFields.length === 0 && customFields.length > 0 ? (
              <CustomFieldContentEmptyState 
                type="no-results"
                onClearFilters={handleClearFilters}
              />
            ) : (
              <CustomFieldTable
                customFields={filteredCustomFields}
                onEditCustomField={handleEditCustomField}
                onDeleteCustomField={handleDeleteCustomField}
                canManage={isRootAdmin}
                isLoading={isTableLoading}
                isFetching={isTableFetching}
                pagination={{
                  page: customFieldsResponse?.page || page,
                  pageSize: customFieldsResponse?.page_size || pageSize,
                  hasNext: customFieldsResponse?.has_next,
                  hasPrevious: (customFieldsResponse?.page || page) > 1,
                  onPageChange: (newPage) => setPage(newPage),
                  onPageSizeChange: (newPageSize) => {
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

      {/* Dialogs */}
      <CustomFieldPageDialogs
        state={state}
        onCloseDialog={closeDialog}
        customFieldMutations={customFieldMutations}
      />
    </>
  )
}