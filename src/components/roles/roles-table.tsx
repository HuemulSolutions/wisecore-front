import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Shield, RefreshCw, UserPlus, Trash2, MoreVertical } from "lucide-react"
import { type Role } from "@/services/rbac"

interface RolesTableProps {
  roles: Role[]
  filteredRoles: Role[]
  totalPermissions: number
  isLoadingUsers: boolean
  onAssignToUsers: (role: Role) => void
  onEditRole: (role: Role) => void
  onDeleteRole: (role: Role) => void
}

export function RolesTable({ 
  roles, 
  filteredRoles, 
  totalPermissions, 
  isLoadingUsers,
  onAssignToUsers,
  onEditRole,
  onDeleteRole
}: RolesTableProps) {
  return (
    <Card className="border border-border bg-card overflow-auto max-h-[75vh]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted z-10">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Role Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Permissions</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground hidden sm:table-cell">Created</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role) => {
              const permissionCount = role.permission_num || role.permissions?.length || 0
              const visiblePermissions = role.permissions?.slice(0, 1) || []
              const remainingPermissions = Math.max(0, (role.permissions?.length || 0) - 1)
              
              return (
                <tr key={role.id} className="border-b border-border hover:bg-muted/20 transition">
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-0">
                      <div className="flex items-center gap-1">
                        <Shield className="w-2 h-2 text-primary flex-shrink-0" />
                        <span className="text-xs font-medium text-foreground leading-tight">{role.name}</span>
                      </div>
                      {role.description && (
                        <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                          {role.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-0.5">
                      <Badge className="text-[10px] px-1.5 py-0 h-5" variant="outline">
                        {permissionCount}
                      </Badge>
                      {visiblePermissions.map((permission) => (
                        <Badge key={permission.id} variant="outline" className="text-[10px] px-1.5 py-0 h-5 hidden sm:inline-flex">
                          {permission.name.split(':')[0]}
                        </Badge>
                      ))}
                      {remainingPermissions > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 hidden sm:inline-flex">
                          +{remainingPermissions}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground hidden sm:table-cell">
                    {new Date(role.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
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
                        <DropdownMenuItem 
                          onSelect={() => onAssignToUsers(role)}
                          className="hover:cursor-pointer"
                          disabled={isLoadingUsers}
                        >
                          {isLoadingUsers ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                          )}
                          {isLoadingUsers ? 'Loading users...' : 'Assign to Users'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onSelect={() => onEditRole(role)}
                          className="hover:cursor-pointer"
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Manage Permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onSelect={() => onDeleteRole(role)}
                          className="hover:cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4 py-2 sm:py-3 bg-muted/20 text-xs text-muted-foreground border-t gap-1 sm:gap-0">
        <span className="text-xs">
          Showing {filteredRoles.length} of {roles.length} roles
        </span>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs">{totalPermissions} total permissions</span>
        </div>
      </div>
    </Card>
  )
}
