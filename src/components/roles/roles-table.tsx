import { Badge } from "@/components/ui/badge"
import { Shield, RefreshCw, UserPlus, Trash2 } from "lucide-react"
import { type Role } from "@/services/rbac"
import { DataTable, type PaginationConfig } from "@/components/ui/data-table"
import type { TableColumn, TableAction, FooterStat } from "@/types/data-table"

interface RolesTableProps {
  roles: Role[]
  filteredRoles: Role[]
  totalPermissions: number
  isLoadingUsers: boolean
  onAssignToUsers: (role: Role) => void
  onEditRole: (role: Role) => void
  onDeleteRole: (role: Role) => void
  pagination?: PaginationConfig
  showFooterStats?: boolean
}

export function RolesTable({ 
  roles, 
  filteredRoles, 
  totalPermissions, 
  isLoadingUsers,
  onAssignToUsers,
  onEditRole,
  onDeleteRole,
  pagination,
  showFooterStats,
}: RolesTableProps) {
  // Define columns
  const columns: TableColumn<Role>[] = [
    {
      key: "name",
      label: "Role Name",
      render: (role) => (
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
      )
    },
    {
      key: "permissions",
      label: "Permissions",
      render: (role) => {
        const permissionCount = role.permission_num || role.permissions?.length || 0
        const visiblePermissions = role.permissions?.slice(0, 1) || []
        const remainingPermissions = Math.max(0, (role.permissions?.length || 0) - 1)

        return (
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
        )
      }
    },
    {
      key: "created",
      label: "Created",
      hideOnMobile: true,
      render: (role) => (
        <span className="text-xs text-foreground">
          {new Date(role.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    }
  ]

  // Define actions
  const actions: TableAction<Role>[] = [
    {
      key: "assign",
      label: isLoadingUsers ? 'Loading users...' : 'Assign to Users',
      icon: isLoadingUsers ? RefreshCw : UserPlus,
      onClick: onAssignToUsers,
      className: isLoadingUsers ? "animate-spin" : ""
    },
    {
      key: "edit",
      label: "Manage Permissions",
      icon: Shield,
      onClick: onEditRole,
      separator: true
    },
    {
      key: "delete",
      label: "Delete Role",
      icon: Trash2,
      onClick: onDeleteRole,
      destructive: true
    }
  ]

  // Define footer stats
  const footerStats: FooterStat[] = [
    {
      label: `Showing ${filteredRoles.length} of ${roles.length} roles`,
      value: ''
    },
    {
      label: 'total permissions',
      value: totalPermissions
    }
  ]

  return (
    <DataTable
      data={filteredRoles}
      columns={columns}
      actions={actions}
      getRowKey={(role) => role.id}
      footerStats={footerStats}
      pagination={pagination}
      showFooterStats={showFooterStats}
    />
  )
}
