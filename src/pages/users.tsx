"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { type User, type UsersResponse } from "@/types/users"
import { useUsers, useUserMutations, userQueryKeys } from "@/hooks/useUsers"
import { toast } from "sonner"
import { handleApiError } from "@/lib/error-utils"

// Components
import {
  UserTable,
  UserPageHeader,
  UserPageSkeleton,
  UserPageEmptyState,
  UserPageDialogs,
  UserContentEmptyState,
  type UserPageState
} from "@/components/users"

export default function UsersPage() {
  const [state, setState] = useState<UserPageState>({
    searchTerm: "",
    filterStatus: "all",
    selectedUsers: new Set(),
    editingUser: null,
    organizationUser: null,
    showCreateDialog: false,
    assigningRoleUser: null,
    deletingUser: null,
    rootAdminUser: null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Get permissions and organization context
  const { canAccessUsers, isOrgAdmin, isRootAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const queryClient = useQueryClient()
  
  // Permisos específicos
  const canListUsers = isOrgAdmin || hasAnyPermission(['user:l', 'user:r'])
  const canCreateUser = isOrgAdmin || hasPermission('user:c')
  const canUpdateUser = isOrgAdmin || hasPermission('user:u')
  const canDeleteUser = isOrgAdmin || hasPermission('user:d')
  
  // Fetch users and mutations - solo si tiene permisos de listar
  const { data: usersResponse, isLoading, isError, refetch } = useUsers(
    !!selectedOrganizationId && !!organizationToken && canListUsers,
    selectedOrganizationId || undefined,
    page,
    pageSize
  ) as {
    data: UsersResponse | undefined,
    isLoading: boolean,
    isError: boolean,
    refetch: () => Promise<unknown>
  }
  const userMutations = useUserMutations()

  // Loading state for permissions
  if (isLoadingPermissions) {
    return <UserPageSkeleton />
  }

  // Access check
  if (!canAccessUsers) {
    return <UserPageEmptyState type="access-denied" />
  }

  // Organization check
  if (!selectedOrganizationId || !organizationToken) {
    return <UserPageEmptyState type="no-organization" />
  }

  // Loading state
  if (isLoading) {
    return <UserPageSkeleton />
  }

  const filteredUsers = usersResponse?.data?.filter((user: User) => {
    const matchesSearch = `${user.name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(state.searchTerm.toLowerCase())
    const matchesFilter = state.filterStatus === "all" || user.status === state.filterStatus

    return matchesSearch && matchesFilter
  }) || []

  // State update helpers
  const updateState = (updates: Partial<UserPageState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const closeDialog = (dialog: keyof UserPageState) => {
    setState(prev => ({ ...prev, [dialog]: null }))
  }

  // Function to refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Invalidate the query to force a fresh fetch from the server
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
      // Refetch to trigger the query execution
      await refetch()
      toast.success('Data refreshed')
    } catch (error) {
      handleApiError(error, { fallbackMessage: 'Failed to refresh data' })
    } finally {
      setIsRefreshing(false)
    }
  }

  // User selection handlers
  const handleUserSelection = (userId: string) => {
    const newSelection = new Set(state.selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    updateState({ selectedUsers: newSelection })
  }

  // User action handlers with lazy data loading
  const handleEditUser = async (user: User) => {
    // Data for editing is usually already available from the user object
    updateState({ editingUser: user })
  }

  const handleViewOrganizations = async (user: User) => {
    // Set the user and let the dialog component handle data fetching
    updateState({ organizationUser: user })
  }

  const handleAssignRoles = async (user: User) => {
    // Set the user and let the dialog/sheet component handle roles fetching
    updateState({ assigningRoleUser: user })
  }

  const handleDeleteUser = async (user: User) => {
    // No additional data needed for delete confirmation
    updateState({ deletingUser: user })
  }

  const handleManageRootAdmin = async (user: User) => {
    // Set the user and let the dialog handle the admin status
    updateState({ rootAdminUser: user })
  }

  const handleSelectAll = () => {
    if (state.selectedUsers.size === filteredUsers.length) {
      updateState({ selectedUsers: new Set() })
    } else {
      updateState({ selectedUsers: new Set(filteredUsers.map((user: User) => user.id)) })
    }
  }

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto">
        {/* Header */}
        <UserPageHeader
          userCount={filteredUsers.length}
          onCreateUser={() => updateState({ showCreateDialog: true })}
          onRefresh={handleRefresh}
          isLoading={isLoading || isRefreshing}
          hasError={isError}
          searchTerm={state.searchTerm}
          onSearchChange={(value) => updateState({ searchTerm: value })}
          filterStatus={state.filterStatus}
          onStatusFilterChange={(value) => updateState({ filterStatus: value })}
          canCreate={canCreateUser}
        />

        {/* Content Area - Table or Error */}
        {isError ? (
          <UserContentEmptyState 
            type="error" 
            message="Error loading users" 
            onRetry={handleRefresh}
          />
        ) : filteredUsers.length === 0 ? (
          <UserContentEmptyState 
            type="empty"
          />
        ) : (
          <UserTable
            users={filteredUsers}
            selectedUsers={state.selectedUsers}
            onUserSelection={handleUserSelection}
            onSelectAll={handleSelectAll}
            onEditUser={handleEditUser}
            onViewOrganizations={handleViewOrganizations}
            onAssignRoles={handleAssignRoles}
            onDeleteUser={handleDeleteUser}
            onManageRootAdmin={handleManageRootAdmin}
            isCurrentUserRootAdmin={isRootAdmin}
            userMutations={userMutations}
            showFooterStats={false}
            canUpdate={canUpdateUser}
            canDelete={canDeleteUser}
            pagination={{
              page: usersResponse?.page || page,
              pageSize: usersResponse?.page_size || pageSize,
              hasNext: usersResponse?.has_next,
              hasPrevious: (usersResponse?.page || page) > 1,
              onPageChange: (newPage) => setPage(newPage),
              onPageSizeChange: (newPageSize) => {
                setPageSize(newPageSize)
                setPage(1)
              },
              pageSizeOptions: [10, 25, 50, 100, 250, 500, 1000]
            }}
          />
        )}

        {/* Dialogs and Sheets */}
        <UserPageDialogs
          state={state}
          onCloseDialog={closeDialog}
          onUpdateState={updateState}
          userMutations={userMutations}
        />
      </div>
    </div>
  )
}
