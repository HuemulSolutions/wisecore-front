import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { getAllOrganizations, addOrganization, updateOrganization, deleteOrganization } from "@/services/organizations"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"

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
  const { t } = useTranslation('organizations')
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
  const { isOrgAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()
  
  // Permisos específicos
  const canListOrgs = isOrgAdmin || hasAnyPermission(['organization:l', 'organization:r'])
  const canUpdateOrg = isOrgAdmin || hasPermission('organization:u')
  const canDeleteOrg = isOrgAdmin || hasPermission('organization:d')
  const canCreateOrg = isOrgAdmin || hasPermission('organization:c')
  
  // Fetch organizations - solo si tiene permisos de listar
  const { data: organizationsResponse, isLoading, isFetching, error: queryError } = useQuery({
    queryKey: ["organizations", page, pageSize, state.searchTerm],
    queryFn: () => getAllOrganizations(page, pageSize, state.searchTerm || undefined),
    placeholderData: (prev) => prev,
    enabled: canListOrgs,
  })

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading,
    isFetching,
    hasData: !!organizationsResponse,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => addOrganization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("showCreateDialog")
      toast.success(t('toasts.created'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string } }) =>
      updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("editingOrganization")
      toast.success(t('toasts.updated'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      toast.success(t('toasts.deleted'))
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
  if (showPageLoader) {
    return <OrganizationPageSkeleton />
  }

  const organizations = (organizationsResponse?.data || []) as Organization[]

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
      toast.success(t('toasts.dataRefreshed'))
    } finally {
      setIsRefreshing(false)
    }
  }

  // Organization action handlers
  const handleEditOrganization = async (organization: Organization) => {
    updateState({ editingOrganization: organization })
  }

  const handleDeleteOrganization = async (organization: Organization) => {
    updateState({ deletingOrganization: organization })
  }

  const handleClearFilters = () => {
    updateState({ searchTerm: "" })
  }

  return (
    <>
      <HuemulPageLayout
        header={
          <OrganizationPageHeader
            organizationCount={organizationsResponse?.total || organizations.length}
            onCreateOrganization={() => updateState({ showCreateDialog: true })}
            onRefresh={handleRefresh}
            isLoading={isRefreshing}
            searchTerm={state.searchTerm}
            onSearchChange={(value: string) => {
              updateState({ searchTerm: value })
              setPage(1)
            }}
            canManage={canCreateOrg}
          />
        }
        headerClassName="p-6 md:p-8 pb-0 md:pb-0"
        columns={[
          {
            content: queryError ? (
              <OrganizationContentEmptyState 
                type="error" 
                message={(queryError as Error).message} 
                onRetry={handleRefresh}
              />
            ) : !isTableLoading && !isTableFetching && organizations.length === 0 && !state.searchTerm ? (
              <OrganizationContentEmptyState 
                type="empty"
                onCreateFirst={() => updateState({ showCreateDialog: true })}
              />
            ) : !isTableLoading && !isTableFetching && organizations.length === 0 ? (
              <OrganizationContentEmptyState 
                type="no-results"
                onClearFilters={handleClearFilters}
              />
            ) : (
              <OrganizationTable
                organizations={organizations}
                onEditOrganization={handleEditOrganization}
                onDeleteOrganization={handleDeleteOrganization}
                isLoading={isTableLoading}
                isFetching={isTableFetching}
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
                canUpdate={canUpdateOrg}
                canDelete={canDeleteOrg}
              />
            ),
            className: "p-6 md:p-8 pt-0 md:pt-0",
          },
        ]}
      />

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
          onConfirm={async () => {
            if (state.deletingOrganization) {
              await deleteMutation.mutateAsync(state.deletingOrganization.id)
            }
          }}
        />
      )}
    </>
  )
}
