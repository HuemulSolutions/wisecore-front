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
  const visiblePermissions = role.permissions?.slice(0, 2) || []
  const remainingPermissions = Math.max(0, (role.permissions?.length || 0) - 2)

  return (
    <TableRow>
      <TableCell className="w-[35%]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="font-medium text-sm text-foreground">{role.name}</span>
          </div>
          {role.description && (
            <p className="text-xs text-muted-foreground">{role.description}</p>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[30%]">
        <div className="flex flex-wrap gap-1">
          <Badge variant="default" className="text-xs px-1.5 py-0.5">
            {permissionCount} permissions
          </Badge>
          {visiblePermissions.map((permission) => (
            <Badge key={permission.id} variant="outline" className="text-xs px-1.5 py-0.5">
              {permission.name.split(':')[0]}
            </Badge>
          ))}
          {remainingPermissions > 0 && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              +{remainingPermissions} more
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[20%] text-xs">
        {formatDate(role.created_at)}
      </TableCell>
      <TableCell className="w-[15%]">
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