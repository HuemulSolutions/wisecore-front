"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { type User, type UsersResponse } from "@/services/users"
import { useUsers, useUserMutations, userQueryKeys } from "@/hooks/useUsers"
import { toast } from "sonner"

// Components
import {
  UserTable,
  UserBulkActions,
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
    deletingUser: null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Get permissions and organization context
  const { canAccessUsers } = useUserPermissions()
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const queryClient = useQueryClient()
  
  // Fetch users and mutations
  const { data: usersResponse, isLoading, error, refetch } = useUsers(
    !!selectedOrganizationId && !!organizationToken,
    selectedOrganizationId || undefined,
    page,
    pageSize
  ) as {
    data: UsersResponse | undefined,
    isLoading: boolean,
    error: any,
    refetch: () => Promise<any>
  }
  const userMutations = useUserMutations()

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
      await queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
      // Refetch to trigger the query execution
      await refetch()
      toast.success('Data refreshed')
    } catch (error) {
      toast.error('Failed to refresh data')
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
          hasError={!!error}
          searchTerm={state.searchTerm}
          onSearchChange={(value) => updateState({ searchTerm: value })}
          filterStatus={state.filterStatus}
          onStatusFilterChange={(value) => updateState({ filterStatus: value })}
        />

        {/* Bulk Actions */}
        {state.selectedUsers.size > 0 && (
          <UserBulkActions
            selectedUsers={state.selectedUsers}
            onClearSelection={() => updateState({ selectedUsers: new Set() })}
            deleteUserMutation={userMutations.deleteUser}
          />
        )}

        {/* Content Area - Table or Error */}
        {error ? (
          <UserContentEmptyState 
            type="error" 
            message={error.message} 
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
            userMutations={userMutations}
            showFooterStats={false}
            pagination={{
              page: page,
              pageSize: pageSize,
              totalItems: usersResponse?.total || filteredUsers.length,
              onPageChange: (newPage) => setPage(newPage),
              onPageSizeChange: (newPageSize) => {
                setPageSize(newPageSize)
                setPage(1)
              },
              pageSizeOptions: [10, 25, 50, 100]
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