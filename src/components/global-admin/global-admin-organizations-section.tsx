"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { Plus, Building2 } from "lucide-react"
import { PageHeader } from "@/huemul/components/huemul-page-header"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { getAllOrganizations, addOrganization, updateOrganization, deleteOrganization } from "@/services/organizations"

import {
  OrganizationTable,
  OrganizationPageSkeleton,
  OrganizationPageEmptyState,
  OrganizationContentEmptyState,
  CreateOrganizationDialog,
  EditOrganizationDialog,
  DeleteOrganizationDialog,
  SetOrganizationAdminDialog,
  type Organization
} from "@/components/organization"

interface OrganizationPageState {
  searchTerm: string
  selectedOrganizations: Set<string>
  editingOrganization: Organization | null
  showCreateDialog: boolean
  deletingOrganization: Organization | null
  settingAdminOrganization: Organization | null
}

export function GlobalAdminOrganizationsSection() {
  const { t } = useTranslation(['organizations', 'global-admin'])
  const [state, setState] = useState<OrganizationPageState>({
    searchTerm: "",
    selectedOrganizations: new Set(),
    editingOrganization: null,
    showCreateDialog: false,
    deletingOrganization: null,
    settingAdminOrganization: null,
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { isRootAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const queryClient = useQueryClient()

  const canListOrgs = isRootAdmin || hasAnyPermission(['organization:l', 'organization:r'])
  const canUpdateOrg = isRootAdmin || hasPermission('organization:u')
  const canDeleteOrg = isRootAdmin || hasPermission('organization:d')

  const { data: organizationsResponse, isLoading, isFetching, error } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => addOrganization(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("showCreateDialog")
      toast.success(t('global-admin:toast.orgCreated'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description?: string; max_users?: number | null; token_limit?: number | null } }) =>
      updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("editingOrganization")
      toast.success(t('global-admin:toast.orgUpdated'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] })
      closeDialog("deletingOrganization")
      toast.success(t('global-admin:toast.orgDeleted'))
    },
  })

  if (isLoadingPermissions) {
    return <OrganizationPageSkeleton />
  }

  if (!canListOrgs) {
    return <OrganizationPageEmptyState type="access-denied" />
  }

  if (showPageLoader) {
    return <OrganizationPageSkeleton />
  }

  const organizations = (organizationsResponse?.data || []) as Organization[]

  const updateState = (updates: Partial<OrganizationPageState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof OrganizationPageState) => {
    setState(prev => ({
      ...prev,
      [dialog]: dialog === "editingOrganization" || dialog === "deletingOrganization" || dialog === "settingAdminOrganization" ? null : false
    }))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ["organizations"] })
      toast.success(t('common:dataRefreshed'))
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleClearFilters = () => {
    updateState({ searchTerm: "" })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="shrink-0">
        <PageHeader
          icon={Building2}
          title={t('header.title')}
          badges={[
            { label: "", value: organizationsResponse?.total ?? organizations.length }
          ]}
          onRefresh={handleRefresh}
          isLoading={isRefreshing}
          primaryAction={isRootAdmin ? {
            label: t('header.createOrganization'),
            icon: Plus,
            onClick: () => updateState({ showCreateDialog: true })
          } : undefined}
          searchConfig={{
            placeholder: t('header.searchPlaceholder'),
            value: state.searchTerm,
            onChange: (value: string) => {
              updateState({ searchTerm: value })
              setPage(1)
            },
            triggerOnEnter: true,
          }}
        />
      </div>

      {error ? (
        <OrganizationContentEmptyState 
          type="error" 
          message={(error as Error).message} 
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
          onEditOrganization={(org: Organization) => updateState({ editingOrganization: org })}
          onDeleteOrganization={(org: Organization) => updateState({ deletingOrganization: org })}
          onSetAdmin={(org: Organization) => updateState({ settingAdminOrganization: org })}
          maxHeight="flex-1 min-h-0"
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
          canSetAdmin={isRootAdmin}
          isRootAdmin={true}
        />
      )}

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
                  description: state.editingOrganization.description || undefined,
                  max_users: state.editingOrganization.max_users,
                  token_limit: state.editingOrganization.token_limit
                }
              })
            }
          }}
          isSaving={updateMutation.isPending}
          onOrgChange={(org: Organization) => updateState({ editingOrganization: org })}
          isRootAdmin={true}
        />
      )}

      {state.deletingOrganization && (
        <DeleteOrganizationDialog
          open={!!state.deletingOrganization}
          onOpenChange={(open: boolean) => !open && closeDialog("deletingOrganization")}
          organization={state.deletingOrganization}
          onConfirm={async () => {
            if (state.deletingOrganization) {
              deleteMutation.mutate(state.deletingOrganization.id)
            }
          }}
        />
      )}

      <SetOrganizationAdminDialog
        organization={state.settingAdminOrganization}
        open={!!state.settingAdminOrganization}
        onOpenChange={(open) => !open && closeDialog("settingAdminOrganization")}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["organizations"] })
        }}
      />
    </div>
  )
}
