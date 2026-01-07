"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { type CustomField } from "@/types/custom-fields"
import { useCustomFields, useCustomFieldMutations } from "@/hooks/useCustomFields"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// Components
import {
  CustomFieldTable,
  CustomFieldPageHeader,
  CustomFieldFilters,
  CustomFieldPageSkeleton,
  CustomFieldPageEmptyState,
  CustomFieldPageDialogs,
  CustomFieldContentEmptyState,
  type CustomFieldPageState
} from "@/components/custom-fields"

export default function CustomFieldsPage() {
  const [state, setState] = useState<CustomFieldPageState>({
    searchTerm: "",
    selectedCustomFields: new Set(),
    editingCustomField: null,
    showCreateDialog: false,
    deletingCustomField: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get auth context
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  
  // Fetch custom fields and mutations
  const { data: customFieldsResponse, isLoading, error } = useCustomFields()
  const customFieldMutations = useCustomFieldMutations()

  // Access check - assuming similar permissions as asset types
  if (!currentUser?.is_root_admin) {
    return <CustomFieldPageEmptyState type="access-denied" />
  }

  // Loading state
  if (isLoading) {
    return <CustomFieldPageSkeleton />
  }

  const customFields = customFieldsResponse?.data || []

  const filteredCustomFields = customFields.filter((customField: CustomField) => {
    const matchesSearch = customField.name
      .toLowerCase()
      .includes(state.searchTerm.toLowerCase()) ||
      customField.description
        ?.toLowerCase()
        .includes(state.searchTerm.toLowerCase())

    return matchesSearch
  })

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

  // Custom field selection handlers
  const handleCustomFieldSelection = (customFieldId: string) => {
    const newSelection = new Set(state.selectedCustomFields)
    if (newSelection.has(customFieldId)) {
      newSelection.delete(customFieldId)
    } else {
      newSelection.add(customFieldId)
    }
    updateState({ selectedCustomFields: newSelection })
  }

  // Custom field action handlers
  const handleEditCustomField = async (customField: CustomField) => {
    updateState({ editingCustomField: customField })
  }

  const handleDeleteCustomField = async (customField: CustomField) => {
    updateState({ deletingCustomField: customField })
  }

  const handleSelectAll = () => {
    if (state.selectedCustomFields.size === filteredCustomFields.length) {
      updateState({ selectedCustomFields: new Set() })
    } else {
      updateState({ selectedCustomFields: new Set(filteredCustomFields.map((customField: CustomField) => customField.id)) })
    }
  }

  const handleClearFilters = () => {
    updateState({ searchTerm: "" })
  }

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="mx-auto">
        {/* Header */}
        <CustomFieldPageHeader
          customFieldCount={filteredCustomFields.length}
          onCreateCustomField={() => updateState({ showCreateDialog: true })}
          onRefresh={handleRefresh}
          isLoading={isLoading || isRefreshing}
        />

        {/* Filters */}
        <CustomFieldFilters
          searchTerm={state.searchTerm}
          onSearchChange={(value: string) => updateState({ searchTerm: value })}
        />

        {/* Content Area - Table or Error */}
        {error ? (
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
            selectedCustomFields={state.selectedCustomFields}
            onCustomFieldSelection={handleCustomFieldSelection}
            onSelectAll={handleSelectAll}
            onEditCustomField={handleEditCustomField}
            onDeleteCustomField={handleDeleteCustomField}
            customFieldMutations={customFieldMutations}
          />
        )}

        {/* Dialogs */}
        <CustomFieldPageDialogs
          state={state}
          onCloseDialog={closeDialog}
          customFieldMutations={customFieldMutations}
        />
      </div>
    </div>
  )
}