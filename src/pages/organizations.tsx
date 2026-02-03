"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { getAllOrganizations, addOrganization, updateOrganization, deleteOrganization } from "@/services/organizations"
import { toast } from "sonner"

// Components
import {
  OrganizationTable,
  OrganizationPageHeader,
  OrganizationPageSkeleton,
  OrganizationPageEmptyState,
  OrganizationContentEmptyState,
  CreateOrganizationDialog,
  EditOrganizationDialog,
  DeleteOrganizationDialog,
  type Organization
} from "@/components/organization"

interface OrganizationPageState {
  searchTerm: string
  selectedOrganizations: Set<string>
  editingOrganization: Organization | null
  showCreateDialog: boolean
  deletingOrganization: Organization | null
}

export default function Organizations() {
  const [state, setState] = useState<OrganizationPageState>({
    searchTerm: "",
    selectedOrganizations: new Set(),
    editingOrganization: null,
    showCreateDialog: false,
    deletingOrganization: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Get permissions
  const { isRootAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()
  
  // Permisos específicos
  const canListOrgs = isRootAdmin || hasAnyPermission(['organization:l', 'organization:r'])
  const canUpdateOrg = isRootAdmin || hasPermission('organization:u')
  const canDeleteOrg = isRootAdmin || hasPermission('organization:d')
  
  // Fetch organizations - solo si tiene permisos de listar
  const { data: organizationsResponse, isLoading, error: queryError } = useQuery({
    queryKey: ["organizations", page, pageSize],
    queryFn: () => getAllOrganizations(page, pageSize),
    enabled: canListOrgs,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => addOrganization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("showCreateDialog")
      toast.success("Organization created successfully")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string } }) => 
      updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("editingOrganization")
      toast.success("Organization updated successfully")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("deletingOrganization")
      toast.success("Organization deleted successfully")
    },
  })

  // Loading state for permissions
  if (isLoadingPermissions) {
    return <OrganizationPageSkeleton />
  }

  // Access check - need at least read/list permission
  if (!canListOrgs) {
    return <OrganizationPageEmptyState type="access-denied" />
  }

  // Loading state
  if (isLoading) {
    return <OrganizationPageSkeleton />
  }

  const organizations = (organizationsResponse?.data || []) as Organization[]

  const filteredOrganizations = organizations.filter((org: Organization) => {
    const matchesSearch = org.name
      .toLowerCase()
      .includes(state.searchTerm.toLowerCase()) ||
      org.description
        ?.toLowerCase()
        .includes(state.searchTerm.toLowerCase())

    return matchesSearch
  })

  // State update helpers
  const updateState = (updates: Partial<OrganizationPageState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof OrganizationPageState) => {
    setState(prev => ({ ...prev, [dialog]: dialog === "editingOrganization" || dialog === "deletingOrganization" ? null : false }))
  }

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ["organizations"] })
      toast.success("Data refreshed")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Organization selection handlers
  const handleOrganizationSelection = (organizationId: string) => {
    const newSelection = new Set(state.selectedOrganizations)
    if (newSelection.has(organizationId)) {
      newSelection.delete(organizationId)
    } else {
      newSelection.add(organizationId)
    }
    updateState({ selectedOrganizations: newSelection })
  }

  // Organization action handlers
  const handleEditOrganization = async (organization: Organization) => {
    updateState({ editingOrganization: organization })
  }

  const handleDeleteOrganization = async (organization: Organization) => {
    updateState({ deletingOrganization: organization })
  }

  const handleSelectAll = () => {
    if (state.selectedOrganizations.size === filteredOrganizations.length) {
      updateState({ selectedOrganizations: new Set() })
    } else {
      updateState({ selectedOrganizations: new Set(filteredOrganizations.map((org: Organization) => org.id)) })
    }
  }

  const handleClearFilters = () => {
    updateState({ searchTerm: "" })
  }

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="mx-auto">
        {/* Header */}
        <OrganizationPageHeader
          organizationCount={organizationsResponse?.total || filteredOrganizations.length}
          onCreateOrganization={() => updateState({ showCreateDialog: true })}
          onRefresh={handleRefresh}
          isLoading={isLoading || isRefreshing}
          searchTerm={state.searchTerm}
          onSearchChange={(value: string) => updateState({ searchTerm: value })}
          canManage={isRootAdmin}
        />

        {/* Content Area - Table or Error */}
        {queryError ? (
          <OrganizationContentEmptyState 
            type="error" 
            message={(queryError as Error).message} 
            onRetry={handleRefresh}
          />
        ) : filteredOrganizations.length === 0 && organizations.length === 0 ? (
          <OrganizationContentEmptyState 
            type="empty"
            onCreateFirst={() => updateState({ showCreateDialog: true })}
          />
        ) : filteredOrganizations.length === 0 ? (
          <OrganizationContentEmptyState 
            type="no-results"
            onClearFilters={handleClearFilters}
          />
        ) : (
          <OrganizationTable
            organizations={filteredOrganizations}
            selectedOrganizations={state.selectedOrganizations}
            onOrganizationSelection={handleOrganizationSelection}
            onSelectAll={handleSelectAll}
            onEditOrganization={handleEditOrganization}
            onDeleteOrganization={handleDeleteOrganization}
            pagination={{
              page: organizationsResponse?.page || page,
              pageSize: organizationsResponse?.page_size || pageSize,
              hasNext: organizationsResponse?.has_next,
              hasPrevious: (organizationsResponse?.page || page) > 1,
              onPageChange: (newPage: number) => setPage(newPage),
              onPageSizeChange: (newPageSize: number) => {
                setPageSize(newPageSize)
                setPage(1)
              },
              pageSizeOptions: [10, 25, 50, 100, 250, 500, 1000]
            }}
            showFooterStats={false}
            canUpdate={canUpdateOrg}
            canDelete={canDeleteOrg}
          />
        )}

        {/* Dialogs */}
        <CreateOrganizationDialog
          open={state.showCreateDialog}
          onOpenChange={(open) => updateState({ showCreateDialog: open })}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />

        {state.editingOrganization && (
          <EditOrganizationDialog
            open={!!state.editingOrganization}
            onOpenChange={(open: boolean) => !open && closeDialog("editingOrganization")}
            organization={state.editingOrganization}
            onSave={() => {
              if (state.editingOrganization) {
                updateMutation.mutate({
                  id: state.editingOrganization.id,
                  data: {
                    name: state.editingOrganization.name,
                    description: state.editingOrganization.description || undefined
                  }
                })
              }
            }}
            isSaving={updateMutation.isPending}
            onOrgChange={(org: Organization) => updateState({ editingOrganization: org })}
          />
        )}

        {state.deletingOrganization && (
          <DeleteOrganizationDialog
            open={!!state.deletingOrganization}
            onOpenChange={(open: boolean) => !open && closeDialog("deletingOrganization")}
            organization={state.deletingOrganization}
            onConfirm={() => {
              if (state.deletingOrganization) {
                deleteMutation.mutate(state.deletingOrganization.id)
              }
            }}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </div>
    </div>
  )
}
