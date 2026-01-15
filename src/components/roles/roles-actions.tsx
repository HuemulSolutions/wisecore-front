import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, Shield, Trash2, UserPlus, Loader2 } from "lucide-react"
import { type Role } from "@/services/rbac"

interface RoleActionsProps {
  role: Role
  isLoadingUsers?: boolean
  onAssignToUsers: (role: Role) => void
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}

export default function RoleActions({ role, isLoadingUsers = false, onAssignToUsers, onEdit, onDelete }: RoleActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="hover:cursor-pointer h-6 w-6 p-0"
          aria-label={`Actions for role ${role.name}`}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onSelect={() => {
            if (!isLoadingUsers) {
              setTimeout(() => onAssignToUsers(role), 0)
            }
          }} 
          className="hover:cursor-pointer text-xs"
          disabled={isLoadingUsers}
        >
          {isLoadingUsers ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-3.5 w-3.5" />
          )}
          {isLoadingUsers ? 'Loading users...' : 'Assign to Users'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onSelect={() => {
            setTimeout(() => onEdit(role), 0)
          }} 
          className="hover:cursor-pointer text-xs"
        >
          <Shield className="mr-2 h-3.5 w-3.5" />
          Manage Permissions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onSelect={() => {
            setTimeout(() => onDelete(role), 0)
          }} 
          className="hover:cursor-pointer text-destructive focus:text-destructive text-xs"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete Role
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}