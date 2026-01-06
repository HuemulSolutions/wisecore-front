import { Badge } from "@/components/ui/badge"
import { TableRow, TableCell } from "@/components/ui/table"
import { Shield } from "lucide-react"
import { type Role } from "@/services/rbac"
import RoleActions from "./role-actions"

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

interface RoleTableRowProps {
  role: Role
  isLoadingUsers?: boolean
  onAssignToUsers: (role: Role) => void
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}

export default function RoleTableRow({ 
  role, 
  isLoadingUsers = false,
  onAssignToUsers, 
  onEdit, 
  onDelete 
}: RoleTableRowProps) {
  const permissionCount = role.permission_num || role.permissions?.length || 0
  const visiblePermissions = role.permissions?.slice(0, 1) || [] // Reduce visible permissions on mobile
  const remainingPermissions = Math.max(0, (role.permissions?.length || 0) - 1)

  return (
    <TableRow>
      <TableCell className="w-[40%] sm:w-[35%]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary flex-shrink-0" />
            <span className="font-medium text-xs sm:text-sm text-foreground truncate">{role.name}</span>
          </div>
          {role.description && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{role.description}</p>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[35%] sm:w-[30%]">
        <div className="flex flex-wrap gap-0.5 sm:gap-1">
          <Badge variant="outline" className="text-xs px-1 sm:px-1.5 py-0.5">
            {permissionCount}
          </Badge>
          {visiblePermissions.map((permission) => (
            <Badge key={permission.id} variant="outline" className="text-xs px-1 sm:px-1.5 py-0.5 hidden sm:inline-flex">
              {permission.name.split(':')[0]}
            </Badge>
          ))}
          {remainingPermissions > 0 && (
            <Badge variant="outline" className="text-xs px-1 sm:px-1.5 py-0.5 hidden sm:inline-flex">
              +{remainingPermissions} more
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden sm:table-cell w-[20%] text-xs">
        {formatDate(role.created_at)}
      </TableCell>
      <TableCell className="w-[25%] sm:w-[15%]">
        <RoleActions
          role={role}
          isLoadingUsers={isLoadingUsers}
          onAssignToUsers={onAssignToUsers}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  )
}