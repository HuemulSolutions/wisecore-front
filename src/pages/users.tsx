"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Building, Shield, Plus } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { type User } from "@/services/users"
import { useUsers, useUserMutations } from "@/hooks/useUsers"
import ProtectedComponent from "@/components/protected-component"

// Components
import UserTable from "@/components/users/user-table"
import UserBulkActions from "@/components/users/user-bulk-actions"
import EditUserDialog from "@/components/edit-user-dialog"
import UserOrganizationsDialog from "@/components/user-organizations-dialog"
import CreateUserDialog from "@/components/create-user-dialog"
import AssignRolesSheet from "@/components/assign-roles-sheet"
import UserDeleteDialog from "@/components/users/user-delete-dialog"

// Types
interface UserPageState {
  searchTerm: string
  filterStatus: string
  selectedUsers: Set<string>
  editingUser: User | null
  organizationUser: User | null
  showCreateDialog: boolean
  assigningRoleUser: User | null
  deletingUser: User | null
}

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

  // Get permissions and organization context
  const { canAccessUsers } = useUserPermissions()
  const { selectedOrganizationId, organizationToken } = useOrganization()
  
  // Fetch users and mutations
  const { data: usersResponse, isLoading, error } = useUsers(!!selectedOrganizationId && !!organizationToken)
  const userMutations = useUserMutations()

  // Access check
  if (!canAccessUsers) {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access user management.</p>
        </div>
      </div>
    )
  }

  // Organization check
  if (!selectedOrganizationId || !organizationToken) {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Organization Required</h2>
          <p className="text-muted-foreground">Please select an organization to view users.</p>
        </div>
      </div>
    )
  }

  // Filter users
  const filteredUsers = usersResponse?.data?.filter((user) => {
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

  const handleSelectAll = () => {
    if (state.selectedUsers.size === filteredUsers.length) {
      updateState({ selectedUsers: new Set() })
    } else {
      updateState({ selectedUsers: new Set(filteredUsers.map(user => user.id)) })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <Skeleton className="h-9 w-48" />
          </div>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Card className="overflow-hidden border border-border bg-card">
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-2">Error loading users</div>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <ProtectedComponent permission="user:c">
              <Button 
                onClick={() => updateState({ showCreateDialog: true })}
                className="hover:cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </ProtectedComponent>
            <Badge variant="outline" className="text-sm">
              {filteredUsers.length} users
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search users..."
            value={state.searchTerm}
            onChange={(e) => updateState({ searchTerm: e.target.value })}
            className="flex-1"
          />
          <Select value={state.filterStatus} onValueChange={(value) => updateState({ filterStatus: value })}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {state.selectedUsers.size > 0 && (
          <UserBulkActions
            selectedUsers={state.selectedUsers}
            onClearSelection={() => updateState({ selectedUsers: new Set() })}
            deleteUserMutation={userMutations.deleteUser}
          />
        )}

        {/* Table */}
        <UserTable
          users={filteredUsers}
          selectedUsers={state.selectedUsers}
          onUserSelection={handleUserSelection}
          onSelectAll={handleSelectAll}
          onEditUser={(user) => updateState({ editingUser: user })}
          onViewOrganizations={(user) => updateState({ organizationUser: user })}
          onAssignRoles={(user) => updateState({ assigningRoleUser: user })}
          onDeleteUser={(user) => updateState({ deletingUser: user })}
          userMutations={userMutations}
        />

        {/* Dialogs and Sheets */}
        <EditUserDialog
          user={state.editingUser}
          open={!!state.editingUser}
          onOpenChange={(open) => !open && closeDialog('editingUser')}
        />

        <UserOrganizationsDialog
          user={state.organizationUser}
          open={!!state.organizationUser}
          onOpenChange={(open) => !open && closeDialog('organizationUser')}
        />

        <CreateUserDialog
          open={state.showCreateDialog}
          onOpenChange={(open) => !open && updateState({ showCreateDialog: false })}
        />

        <AssignRolesSheet
          user={state.assigningRoleUser}
          open={!!state.assigningRoleUser}
          onOpenChange={(open) => !open && closeDialog('assigningRoleUser')}
          onSuccess={() => {
            console.log('Roles assigned successfully, users list will be refreshed')
          }}
        />

        <UserDeleteDialog
          user={state.deletingUser}
          open={!!state.deletingUser}
          onOpenChange={(open) => !open && closeDialog('deletingUser')}
          onConfirm={(user) => {
            userMutations.deleteUser.mutate(user.id)
            closeDialog('deletingUser')
          }}
        />
      </div>
    </div>
  )
}