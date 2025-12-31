import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Trash2, Check, X, Edit, Shield, Users, Building, UserPlus, MoreVertical } from "lucide-react"
import { type User } from "@/services/users"
import { type UseMutationResult } from "@tanstack/react-query"
import ProtectedComponent from "@/components/protected-component"

// Helper functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const formatBirthday = (birthDay: number | null, birthMonth: number | null) => {
  if (!birthDay || !birthMonth) return 'N/A'
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[birthMonth - 1]} ${birthDay}`
}

export const getStatusColor = (status: string) => {
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

export const translateStatus = (status: string) => {
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

interface UserTableProps {
  users: User[]
  selectedUsers: Set<string>
  onUserSelection: (userId: string) => void
  onSelectAll: () => void
  onEditUser: (user: User) => void
  onViewOrganizations: (user: User) => void
  onAssignRoles: (user: User) => void
  onDeleteUser: (user: User) => void
  userMutations: {
    approveUser: UseMutationResult<any, any, string, unknown>
    rejectUser: UseMutationResult<any, any, string, unknown>
    deleteUser: UseMutationResult<any, any, string, unknown>
  }
}

export default function UserTable({
  users,
  selectedUsers: _selectedUsers,
  onUserSelection: _onUserSelection,
  onSelectAll: _onSelectAll,
  onEditUser,
  onViewOrganizations,
  onAssignRoles,
  onDeleteUser,
  userMutations
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
          <p className="text-muted-foreground">
            No users have been created yet or match your search criteria.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border border-border bg-card overflow-auto max-h-[75vh]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted z-10">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Email</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Birthday</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Roles</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Status</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Created</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-muted/20 transition">
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0">
                    <span className="text-xs font-medium text-foreground leading-tight">
                      {user.name} {user.last_name}
                    </span>
                    {user.activated_at && (
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        Activated: {formatDate(user.activated_at)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-blue-600 font-medium">{user.email}</td>
                <td className="px-3 py-2 text-xs text-foreground">
                  {formatBirthday(user.birth_day || null, user.birth_month || null)}
                </td>
                <td className="px-3 py-2">
                  {user.roles && user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-0.5">
                      {user.is_root_admin && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          <Shield className="w-2 h-2 mr-0.5" />
                          Admin
                        </Badge>
                      )}
                      {user.roles.slice(0, user.is_root_admin ? 1 : 1).map((role) => (
                        <Badge key={role.id} className="text-[10px] px-1.5 py-0 h-5">
                          <Shield className="w-2 h-2 mr-0.5" />
                          {role.name}
                        </Badge>
                      ))}
                      {user.roles.length > (user.is_root_admin ? 1 : 1) && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          +{user.roles.length - (user.is_root_admin ? 1 : 1)}
                        </Badge>
                      )}
                    </div>
                  ) : user.is_root_admin ? (
                    <div className="flex flex-wrap gap-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                        <Shield className="w-2 h-2 mr-0.5" />
                        Admin
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">No roles</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(user.status)}`}>
                    {translateStatus(user.status)}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-xs text-foreground">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="hover:cursor-pointer h-6 w-6 p-0"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.status === 'pending' && (
                        <>
                          <ProtectedComponent permission="user:u">
                            <DropdownMenuItem 
                              onSelect={() => userMutations.approveUser.mutate(user.id)}
                              disabled={userMutations.approveUser.isPending}
                              className="hover:cursor-pointer"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve User
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onSelect={() => userMutations.rejectUser.mutate(user.id)}
                              disabled={userMutations.rejectUser.isPending}
                              className="hover:cursor-pointer"
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject User
                            </DropdownMenuItem>
                          </ProtectedComponent>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <ProtectedComponent permissions={["rbac:manage", "user:u"]}>
                        <DropdownMenuItem onSelect={() => {
                          setTimeout(() => onAssignRoles(user), 0)
                        }} className="hover:cursor-pointer">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Assign Roles
                        </DropdownMenuItem>
                      </ProtectedComponent>
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => onViewOrganizations(user), 0)
                      }} className="hover:cursor-pointer">
                        <Building className="mr-2 h-4 w-4" />
                        View Organizations
                      </DropdownMenuItem>
                      <ProtectedComponent permission="user:u">
                        <DropdownMenuItem onSelect={() => {
                          setTimeout(() => onEditUser(user), 0)
                        }} className="hover:cursor-pointer">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                      </ProtectedComponent>
                      <DropdownMenuSeparator />
                      <ProtectedComponent permission="user:d">
                        <DropdownMenuItem onSelect={() => {
                          setTimeout(() => onDeleteUser(user), 0)
                        }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </ProtectedComponent>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4 py-2 sm:py-3 bg-muted/20 text-xs text-muted-foreground border-t gap-1 sm:gap-0">
        <span className="text-xs">
          Showing {users.length} users
        </span>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs">{users.filter(u => u.status === 'active').length} active users</span>
        </div>
      </div>
    </Card>
  )
}