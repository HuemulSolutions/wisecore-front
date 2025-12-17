"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Check, X, Edit, Shield, Users, Building, Plus, UserPlus, MoreVertical } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useOrganization } from "@/contexts/organization-context"
import { type User } from "@/services/users"
import { useUsers, useUserMutations } from "@/hooks/useUsers"

import EditUserDialog from "@/components/edit-user-dialog"
import UserOrganizationsDialog from "@/components/user-organizations-dialog"
import CreateUserDialog from "@/components/create-user-dialog"
import AssignRolesSheet from "@/components/assign-roles-sheet"

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100/80 text-green-700 border-green-200'
    case 'inactive':
      return 'bg-red-100/80 text-red-700 border-red-200'
    case 'pending':
      return 'bg-yellow-100/80 text-yellow-700 border-yellow-200'
    default:
      return 'bg-gray-100/80 text-gray-700 border-gray-200'
  }
}

const translateStatus = (status: string) => {
  switch (status) {
    case 'active':
      return 'Activo'
    case 'inactive':
      return 'Inactivo'
    case 'pending':
      return 'Pendiente'
    default:
      return status
  }
}



export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [organizationUser, setOrganizationUser] = useState<User | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [assigningRoleUser, setAssigningRoleUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  // Get organization context
  const { selectedOrganizationId, organizationToken } = useOrganization()
  
  // Fetch users and mutations (must be called before any conditional returns)
  const { data: usersResponse, isLoading, error } = useUsers(!!selectedOrganizationId && !!organizationToken)
  const { approveUser: approveUserMutation, rejectUser: rejectUserMutation, deleteUser: deleteUserMutation } = useUserMutations()

  // Check if user is admin
  if (!currentUser?.is_root_admin) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
        </div>
      </div>
    )
  }

  // Check if organization is selected
  if (!selectedOrganizationId || !organizationToken) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
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
      .includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === "all" || user.status === filterStatus

    return matchesSearch && matchesFilter
  }) || []

  // Handle user selection
  const handleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
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
      <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-2">Error loading users</div>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="hover:cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
            <Badge variant="outline" className="text-sm">
              {filteredUsers.length} users
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
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
        {selectedUsers.size > 0 && (
          <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selectedUsers.size} user(s) selected
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
                  <AlertDialogTitle>Delete Users</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedUsers.size} selected user(s)? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      selectedUsers.forEach(userId => {
                        deleteUserMutation.mutate(userId)
                      })
                      setSelectedUsers(new Set())
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
        <Card className="overflow-hidden border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-12 px-4 py-4 text-left">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Roles</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-foreground">Created</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/20 transition">
                    <td className="w-12 px-4 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded" 
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleUserSelection(user.id)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {user.name} {user.last_name}
                        </span>
                        {user.activated_at && (
                          <span className="text-xs text-muted-foreground">
                            Activated: {formatDate(user.activated_at)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-blue-600 font-medium">{user.email}</td>
                    <td className="px-4 py-4">
                      {user.roles && user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.is_root_admin && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.roles.slice(0, user.is_root_admin ? 1 : 2).map((role) => (
                            <Badge key={role.id} className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              {role.name}
                            </Badge>
                          ))}
                          {user.roles.length > (user.is_root_admin ? 1 : 2) && (
                            <Badge variant="outline" className="text-xs">
                              +{user.roles.length - (user.is_root_admin ? 1 : 2)} more
                            </Badge>
                          )}
                        </div>
                      ) : user.is_root_admin ? (
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No roles</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={getStatusColor(user.status)}>
                        {translateStatus(user.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground">
                      {formatDate(user.created_at)}
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
                          {user.status === 'pending' && (
                            <>
                              <DropdownMenuItem 
                                onSelect={() => approveUserMutation.mutate(user.id)}
                                disabled={approveUserMutation.isPending}
                                className="hover:cursor-pointer"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve User
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onSelect={() => rejectUserMutation.mutate(user.id)}
                                disabled={rejectUserMutation.isPending}
                                className="hover:cursor-pointer"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setAssigningRoleUser(user)
                            }, 0)
                          }} className="hover:cursor-pointer">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign Roles
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setOrganizationUser(user)
                            }, 0)
                          }} className="hover:cursor-pointer">
                            <Building className="mr-2 h-4 w-4" />
                            View Organizations
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setEditingUser(user)
                            }, 0)
                          }} className="hover:cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => {
                            // Use setTimeout so the dropdown menu fully closes before the dialog appears
                            setTimeout(() => {
                              setDeletingUser(user)
                            }, 0)
                          }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "No users have been created yet."}
              </p>
            </div>
          )}
        </Card>

        {/* Edit User Dialog */}
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => {
            if (!open) {
              setEditingUser(null)
            }
          }}
        />

        {/* User Organizations Dialog */}
        <UserOrganizationsDialog
          user={organizationUser}
          open={!!organizationUser}
          onOpenChange={(open) => {
            if (!open) {
              setOrganizationUser(null)
            }
          }}
        />

        {/* Create User Dialog */}
        <CreateUserDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false)
            }
          }}
        />

        {/* Assign Roles Sheet */}
        <AssignRolesSheet
          user={assigningRoleUser}
          open={!!assigningRoleUser}
          onOpenChange={(open) => {
            if (!open) {
              setAssigningRoleUser(null)
            }
          }}
        />

        {/* Delete User Dialog */}
        <AlertDialog 
          open={!!deletingUser} 
          onOpenChange={(open) => {
            if (!open) {
              setDeletingUser(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingUser?.name} {deletingUser?.last_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingUser) {
                    deleteUserMutation.mutate(deletingUser.id)
                    setDeletingUser(null)
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
