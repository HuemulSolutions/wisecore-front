"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useRoles, useRoleMutations } from "@/hooks/useRbac"
import { useUsers } from "@/hooks/useUsers"
import { useRoleFiltering } from "@/hooks/useRoleManagement"
import { type Role } from "@/services/rbac"
import CreateRoleSheet from "@/components/roles/roles-create-sheet"
import EditRoleSheet from "@/components/roles/roles-edit-sheet"
import AssignRolesSheet from "@/components/roles/roles-assign-sheet"
import AssignRoleToUsersDialog from "@/components/roles/roles-assign-to-users-sheet"
import RolesEmptyState from "@/components/roles/roles-empty-state"
import { 
  RolesLoadingState, 
  RolesContentEmptyState, 
  RolesAccessDenied, 
  RolesSearch, 
  RolesTable,
  DeleteRoleDialog
} from "@/components/roles"

/**
 * Roles management page
 * Provides interface for creating, editing, and managing user roles and permissions
 */
export default function Roles() {
  useAuth()
  
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  const [assigningRoleToUsers, setAssigningRoleToUsers] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingUsers] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Permissions check
  const { canAccessRoles, hasPermission, isRootAdmin, isLoading: isLoadingPermissions } = useUserPermissions()
  
  // Permisos específicos
  const canReadRbac = isRootAdmin || hasPermission('rbac:r')
  const canManageRbac = isRootAdmin || hasPermission('rbac:manage')

  // Data fetching - solo si tiene permisos de lectura
  const { data: rolesResponse, isLoading, error, refetch: refetchRoles } = useRoles(canReadRbac, page, pageSize)
  const { deleteRole } = useRoleMutations()
  // Users data - we'll use refetch to load on demand, so disable automatic fetching
  const { data: usersResponse } = useUsers(false)

  // Derived data
  const roles = rolesResponse?.data || []
  const users = usersResponse?.data || []
  const filteredRoles = useRoleFiltering(roles, searchTerm)

  // Event handlers

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetchRoles()
    } finally {
      setIsRefreshing(false)
    }
  }

  const openDialog = {
    create: () => setShowCreateDialog(true),
    assignToUsers: (role: Role) => {
      setTimeout(() => {
        setAssigningRoleToUsers(role)
      }, 0)
    },
    edit: (role: Role) => {
      setTimeout(() => {
        setEditingRole(role)
      }, 0)
    },
    delete: (role: Role) => {
      setTimeout(() => {
        setDeletingRole(role)
      }, 0)
    }
  }

  const closeDialog = {
    create: () => setShowCreateDialog(false),
    assignToUsers: () => setAssigningRoleToUsers(null),
    edit: () => setEditingRole(null),
    delete: () => setDeletingRole(null),
    assignUser: () => setAssigningUserId(null)
  }

  const confirmDeleteRole = async () => {
    if (!deletingRole) return

    setIsDeleting(true)
    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          deleteRole.mutate(deletingRole.id, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          })
        }),
        minDelay
      ])
    } finally {
      setIsDeleting(false)
      closeDialog.delete()
    }
  }

  // Early returns for different states
  if (isLoadingPermissions) return <RolesLoadingState />
  if (!canAccessRoles) return <RolesAccessDenied />
  if (isLoading) return <RolesLoadingState />

  const totalPermissions = error ? 0 : roles.reduce(
    (acc, role) => acc + (role.permission_num || role.permissions?.length || 0), 
    0
  )

  return (
    <div className="bg-background p-2 sm:p-4 md:p-4 lg:p-6">
      <div className="mx-auto">
        <RolesSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          rolesCount={filteredRoles.length}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onCreateRole={openDialog.create}
          hasError={!!error}
          canManage={canManageRbac}
        />

        {/* Show error state or content */}
        {error ? (
          <RolesContentEmptyState error={error} onRetry={handleRefresh} />
        ) : filteredRoles.length === 0 ? (
          <RolesEmptyState hasSearchTerm={searchTerm.length > 0} onCreateRole={openDialog.create} />
        ) : (
          <RolesTable
            roles={roles}
            filteredRoles={filteredRoles}
            totalPermissions={totalPermissions}
            isLoadingUsers={isLoadingUsers}
            onAssignToUsers={openDialog.assignToUsers}
            onEditRole={openDialog.edit}
            onDeleteRole={openDialog.delete}
            showFooterStats={false}
            canManage={canManageRbac}
            pagination={{
              page: rolesResponse?.page || page,
              pageSize: rolesResponse?.page_size || pageSize,
              hasNext: rolesResponse?.has_next,
              hasPrevious: (rolesResponse?.page || page) > 1,
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
        <CreateRoleSheet
          open={showCreateDialog}
          onOpenChange={(open) => !open && closeDialog.create()}
        />

        <EditRoleSheet
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => !open && closeDialog.edit()}
        />

        <AssignRolesSheet
          user={users.find(u => u.id === assigningUserId) || null}
          open={!!assigningUserId}
          onOpenChange={(open) => !open && closeDialog.assignUser()}
        />

        <AssignRoleToUsersDialog
          role={assigningRoleToUsers}
          open={!!assigningRoleToUsers}
          onOpenChange={(open) => !open && closeDialog.assignToUsers()}
        />

        <DeleteRoleDialog
          open={!!deletingRole}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              closeDialog.delete()
            }
          }}
          role={deletingRole}
          onConfirm={confirmDeleteRole}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}