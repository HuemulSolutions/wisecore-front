"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Shield, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useRoles, useRoleMutations } from "@/hooks/useRbac"
import { useUsers } from "@/hooks/useUsers"
import { useRoleFiltering } from "@/hooks/useRoleManagement"
import { type Role } from "@/services/rbac"
import CreateRoleSheet from "@/components/create-role-sheet"
import EditRoleSheet from "@/components/edit-role-sheet"
import AssignRolesSheet from "@/components/assign-roles-sheet"
import AssignRoleToUsersDialog from "@/components/assign-role-to-users-dialog"
import UserSelectDialog from "@/components/roles/user-select-dialog"
import RoleTableRow from "@/components/roles/role-table-row"
import RolesEmptyState from "@/components/roles/roles-empty-state"

// Loading Component
function RolesLoadingState() {
  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mb-4">
          <Skeleton className="h-9 w-80" />
        </div>
        <Card className="overflow-hidden border border-border bg-card">
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// Error Component
function RolesErrorState({ error }: { error: any }) {
  return (
    <div className="bg-background p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg font-semibold text-foreground mb-2">Error loading roles</div>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  )
}

// Access Denied Component  
function AccessDeniedState() {
  return (
    <div className="bg-background p-4 md:p-6 flex items-center justify-center">
      <div className="text-center">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to access role management.</p>
      </div>
    </div>
  )
}

export default function RolesPage() {
  useAuth()
  
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUserSelectDialog, setShowUserSelectDialog] = useState(false)
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  const [assigningRoleToUsers, setAssigningRoleToUsers] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // Permissions check
  const { canAccessRoles } = useUserPermissions()

  // Data fetching
  const { data: rolesResponse, isLoading, error, refetch: refetchRoles } = useRoles()
  const { deleteRole } = useRoleMutations()
  // Users data - we'll use refetch to load on demand
  const { data: usersResponse, refetch: refetchUsers } = useUsers()

  // Derived data
  const roles = rolesResponse?.data || []
  const users = usersResponse?.data || []
  const filteredRoles = useRoleFiltering(roles, searchTerm)

  // Event handlers
  const handleUserSelect = (userId: string) => {
    setAssigningUserId(userId)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetchRoles()
    } finally {
      setIsRefreshing(false)
    }
  }

  // Refresh data on component mount
  useEffect(() => {
    handleRefresh()
  }, [])

  const openDialog = {
    create: () => setShowCreateDialog(true),
    userSelect: async () => {
      setIsLoadingUsers(true)
      try {
        await refetchUsers()
        setShowUserSelectDialog(true)
      } finally {
        setIsLoadingUsers(false)
      }
    },
    assignToUsers: async (role: Role) => {
      setIsLoadingUsers(true)
      try {
        await refetchUsers()
        setAssigningRoleToUsers(role)
      } finally {
        setIsLoadingUsers(false)
      }
    },
    edit: (role: Role) => setEditingRole(role),
    delete: (role: Role) => setDeletingRole(role)
  }

  const closeDialog = {
    create: () => setShowCreateDialog(false),
    userSelect: () => setShowUserSelectDialog(false),
    assignToUsers: () => setAssigningRoleToUsers(null),
    edit: () => setEditingRole(null),
    delete: () => setDeletingRole(null),
    assignUser: () => setAssigningUserId(null)
  }

  // Early returns for different states
  if (!canAccessRoles) return <AccessDeniedState />
  if (isLoading) return <RolesLoadingState />
  if (error) return <RolesErrorState error={error} />

  const totalPermissions = roles.reduce(
    (acc, role) => acc + (role.permission_num || role.permissions?.length || 0), 
    0
  )

  return (
    <div className="bg-background p-4 md:p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Roles & Permissions</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="hover:cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button 
              onClick={openDialog.create}
              className="hover:cursor-pointer"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Role
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Badge variant="outline" className="text-xs px-2 py-1">
            {filteredRoles.length} roles
          </Badge>
        </div>

        {/* Table */}
        <Card className="overflow-hidden border border-border bg-card">
          {filteredRoles.length > 0 ? (
            <>
              <div className="relative">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[35%]">Role Name</TableHead>
                      <TableHead className="w-[30%]">Permissions</TableHead>
                      <TableHead className="w-[20%]">Created</TableHead>
                      <TableHead className="w-[15%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                </Table>
                <div className="overflow-y-auto max-h-[60vh]">
                  <Table>
                    <TableBody>
                      {filteredRoles.map((role) => (
                        <RoleTableRow
                          key={role.id}
                          role={role}
                          isLoadingUsers={isLoadingUsers}
                          onAssignToUsers={openDialog.assignToUsers}
                          onEdit={openDialog.edit}
                          onDelete={openDialog.delete}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Footer stats */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/20 text-xs text-muted-foreground border-t">
                <span>
                  Showing {filteredRoles.length} of {roles.length} roles
                </span>
                <div className="flex items-center gap-4">
                  <span>{totalPermissions} total permissions</span>
                </div>
              </div>
            </>
          ) : (
            <RolesEmptyState 
              hasSearchTerm={!!searchTerm} 
              onCreateRole={openDialog.create} 
            />
          )}
        </Card>

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

        <UserSelectDialog
          open={showUserSelectDialog}
          onOpenChange={(open) => {
            setShowUserSelectDialog(open)
            if (!open) closeDialog.userSelect()
          }}
          onUserSelect={handleUserSelect}
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

        <AlertDialog 
          open={!!deletingRole} 
          onOpenChange={(open) => !open && closeDialog.delete()}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the role "{deletingRole?.name}"? 
                This action cannot be undone and will remove all assignments of this role.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingRole) {
                    deleteRole.mutate(deletingRole.id)
                    closeDialog.delete()
                  }
                }}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
