"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { Edit2, Trash2, Plus, Search, Shield, UserPlus, Users, MoreVertical } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRoles, useRoleMutations } from "@/hooks/useRbac"
import { type Role } from "@/services/rbac"
import CreateRoleSheet from "@/components/create-role-sheet"
import EditRoleSheet from "@/components/edit-role-sheet"
import AssignRolesSheet from "@/components/assign-roles-sheet"
import AssignRoleToUsersDialog from "@/components/assign-role-to-users-dialog"
import { useUsers } from "@/hooks/useUsers"

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

interface UserSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserSelect: (userId: string) => void
}

function UserSelectDialog({ open, onOpenChange, onUserSelect }: UserSelectDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const { data: usersResponse, isLoading } = useUsers()
  
  const users = usersResponse?.data || []
  const filteredUsers = users.filter(user => 
    `${user.name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Select User</AlertDialogTitle>
          <AlertDialogDescription>
            Choose a user to assign roles to.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition"
                  onClick={() => {
                    onUserSelect(user.id)
                    onOpenChange(false)
                  }}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  {user.is_root_admin && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function RolesPage() {
  const { user: currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showUserSelectDialog, setShowUserSelectDialog] = useState(false)
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  const [assigningRoleToUsers, setAssigningRoleToUsers] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  // Check if user is admin
  if (!currentUser?.is_root_admin) {
    return (
      <div className="bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
        </div>
      </div>
    )
  }

  // Fetch roles and mutations
  const { data: rolesResponse, isLoading, error } = useRoles()
  const { deleteRole } = useRoleMutations()
  const { data: usersResponse } = useUsers()

  const roles = rolesResponse?.data || []
  const users = usersResponse?.data || []

  // Filter roles
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle role selection
  const handleRoleSelection = (roleId: string) => {
    const newSelection = new Set(selectedRoles)
    if (newSelection.has(roleId)) {
      newSelection.delete(roleId)
    } else {
      newSelection.add(roleId)
    }
    setSelectedRoles(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedRoles.size === filteredRoles.length) {
      setSelectedRoles(new Set())
    } else {
      setSelectedRoles(new Set(filteredRoles.map(role => role.id)))
    }
  }

  const handleUserSelect = (userId: string) => {
    setAssigningUserId(userId)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-background p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="mb-6">
            <Skeleton className="h-10 w-80" />
          </div>
          <Card className="overflow-hidden border border-border bg-card">
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
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
          <div className="text-2xl font-bold text-foreground mb-2">Error loading roles</div>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Roles & Permissions</h1>
          </div>
          <div className="flex gap-2">
            {/* <Button 
              onClick={() => setShowUserSelectDialog(true)}
              variant="outline"
              className="hover:cursor-pointer"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Assign Roles
            </Button> */}
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="hover:cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredRoles.length} roles
          </Badge>
        </div>

        {/* Bulk Actions */}
        {selectedRoles.size > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedRoles.size} role(s) selected
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Roles</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedRoles.size} selected role(s)? This action cannot be undone and will remove all role assignments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      selectedRoles.forEach(roleId => {
                        deleteRole.mutate(roleId)
                      })
                      setSelectedRoles(new Set())
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Table */}
        <Card className="overflow border border-border bg-card overflow-auto max-h-[70vh]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-12 px-4 py-4 text-left">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={selectedRoles.size === filteredRoles.length && filteredRoles.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Role Name</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Permissions</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Created</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => (
                  <tr key={role.id} className="border-b border-border hover:bg-muted/20 transition">
                    <td className="w-12 px-4 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded" 
                        checked={selectedRoles.has(role.id)}
                        onChange={() => handleRoleSelection(role.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">{role.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="default" className="text-xs">
                          {role.permission_num || role.permissions?.length || 0} permissions
                        </Badge>
                        {role.permissions?.slice(0, 2).map((permission) => (
                          <Badge key={permission.id} variant="outline" className="text-xs">
                            {permission.name.split(':')[0]}
                          </Badge>
                        ))}
                        {role.permissions && role.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {formatDate(role.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="hover:cursor-pointer h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setAssigningRoleToUsers(role)
                            }, 0)
                          }} className="hover:cursor-pointer">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign to Users
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setEditingRole(role)
                            }, 0)
                          }} className="hover:cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setDeletingRole(role)
                            }, 0)
                          }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRoles.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No roles found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search criteria."
                  : "No roles have been created yet."}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-4 hover:cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Role
                </Button>
              )}
            </div>
          )}

          {/* Footer stats */}
          {filteredRoles.length > 0 && (
            <div className="flex items-center justify-between px-4 py-4 bg-muted/20 text-sm text-muted-foreground">
              <span>
                Showing {filteredRoles.length} of {roles.length} roles
              </span>
              <div className="flex items-center gap-4">
                <span>{users.length} total users</span>
                <span>{roles.reduce((acc, role) => acc + (role.permission_num || role.permissions?.length || 0), 0)} total permissions</span>
              </div>
            </div>
          )}
        </Card>

        {/* Sheets */}
        <CreateRoleSheet
          open={showCreateDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false)
            }
          }}
        />

        <EditRoleSheet
          role={editingRole}
          open={!!editingRole}
          onOpenChange={(open) => {
            if (!open) {
              setEditingRole(null)
            }
          }}
        />

        <UserSelectDialog
          open={showUserSelectDialog}
          onOpenChange={setShowUserSelectDialog}
          onUserSelect={handleUserSelect}
        />

        <AssignRolesSheet
          user={users.find(u => u.id === assigningUserId) || null}
          open={!!assigningUserId}
          onOpenChange={(open) => {
            if (!open) {
              setAssigningUserId(null)
            }
          }}
        />

        <AssignRoleToUsersDialog
          role={assigningRoleToUsers}
          open={!!assigningRoleToUsers}
          onOpenChange={(open) => {
            if (!open) {
              setAssigningRoleToUsers(null)
            }
          }}
        />

        <AlertDialog 
          open={!!deletingRole} 
          onOpenChange={(open) => {
            if (!open) {
              setDeletingRole(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the role "{deletingRole?.name}"? This action cannot be undone and will remove all assignments of this role.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingRole) {
                    deleteRole.mutate(deletingRole.id)
                    setDeletingRole(null)
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
