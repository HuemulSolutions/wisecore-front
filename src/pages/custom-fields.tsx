"use client"

import { useState } from "react"
import { useOrganization } from "@/contexts/organization-context"
import { usePageAccess } from "@/hooks/usePageAccess"
import { type CustomField } from "@/types/custom-fields"
import { useCustomFields, useCustomFieldMutations } from "@/hooks/useCustomFields"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { useQueryClient } from "@tanstack/react-query"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"

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
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  // Get permissions
  const { selectedOrganizationId } = useOrganization()
  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess('custom-fields')
  const queryClient = useQueryClient()

  const canList = can('listCustomFields')
  const canCreate = can('createCustomField')
  const canUpdate = can('updateCustomField')
  const canDelete = can('deleteCustomField')

  // Fetch custom fields and mutations - solo si el usuario puede listar
  const { data: customFieldsResponse, isLoading, isFetching, error } = useCustomFields({
    page,
    page_size: pageSize,
    search: state.searchTerm || undefined,
    enabled: canList && !!selectedOrganizationId
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

  // Access check
  if (!canAccessPage) {
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
    } finally {
      setIsRefreshing(false)
    }
  }

  // Custom field action handlers
  const handleEditCustomField = (customField: CustomField) => {
    updateState({ editingCustomField: customField })
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
            isLoading={isRefreshing || isFetching}
            searchTerm={state.searchTerm}
            onSearchChange={(value: string) => {
              updateState({ searchTerm: value })
              setPage(1)
            }}
            canCreate={canCreate}
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
                onCreateFirst={canCreate ? () => updateState({ showCreateDialog: true }) : undefined}
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
                canUpdate={canUpdate}
                canDelete={canDelete}
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
                  pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS
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
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </>
  )
}