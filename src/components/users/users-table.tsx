import { Badge } from "@/components/ui/badge"
import { Trash2, Check, X, Edit, Shield, Users, Building, UserPlus, ShieldCheck } from "lucide-react"
import { type User } from "@/types/users"
import { type UseMutationResult } from "@tanstack/react-query"
import { DataTable, type PaginationConfig } from "@/components/ui/data-table"
import type { TableColumn, TableAction, FooterStat } from "@/types/data-table"

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
  onManageRootAdmin: (user: User) => void
  isCurrentUserRootAdmin?: boolean
  userMutations: {
    approveUser: UseMutationResult<any, any, string, unknown>
    rejectUser: UseMutationResult<any, any, string, unknown>
    deleteUser: UseMutationResult<any, any, string, unknown>
  }
  pagination?: PaginationConfig
  showFooterStats?: boolean
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
  onManageRootAdmin,
  isCurrentUserRootAdmin = false,
  userMutations,
  pagination,
  showFooterStats,
}: UserTableProps) {
  // Define columns
  const columns: TableColumn<User>[] = [
    {
      key: "name",
      label: "Name",
      render: (user) => (
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
      )
    },
    {
      key: "email",
      label: "Email",
      render: (user) => (
        <span className="text-xs text-blue-600 font-medium">{user.email}</span>
      )
    },
    {
      key: "birthday",
      label: "Birthday",
      render: (user) => (
        <span className="text-xs text-foreground">
          {formatBirthday(user.birth_day || null, user.birth_month || null)}
        </span>
      )
    },
    {
      key: "roles",
      label: "Roles",
      render: (user) => {
        if (user.roles && user.roles.length > 0) {
          return (
            <div className="flex flex-wrap gap-0.5">
              {user.is_root_admin && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                  <Shield className="w-2 h-2 mr-0.5" />
                  Admin
                </Badge>
              )}
              {user.roles.slice(0, user.is_root_admin ? 1 : 1).map((role) => (
                <Badge key={role.id} className="text-[10px] px-1.5 py-0 h-5" variant="outline">
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
          )
        } else if (user.is_root_admin) {
          return (
            <div className="flex flex-wrap gap-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                <Shield className="w-2 h-2 mr-0.5" />
                Admin
              </Badge>
            </div>
          )
        }
        return <span className="text-[10px] text-muted-foreground">No roles</span>
      }
    },
    {
      key: "status",
      label: "Status",
      render: (user) => (
        <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(user.status)}`}>
          {translateStatus(user.status)}
        </Badge>
      )
    },
    {
      key: "created",
      label: "Created",
      render: (user) => (
        <span className="text-xs text-foreground">{formatDate(user.created_at)}</span>
      )
    }
  ]

  // Define actions - note: conditional actions using show property
  const actions: TableAction<User>[] = [
    {
      key: "approve",
      label: "Approve User",
      icon: Check,
      onClick: (user) => userMutations.approveUser.mutate(user.id),
      show: (user) => user.status === 'pending',
      className: "text-green-600"
    },
    {
      key: "reject",
      label: "Reject User",
      icon: X,
      onClick: (user) => userMutations.rejectUser.mutate(user.id),
      show: (user) => user.status === 'pending',
      separator: true,
      destructive: true
    },
    {
      key: "assign-roles",
      label: "Assign Roles",
      icon: UserPlus,
      onClick: onAssignRoles
    },
    {
      key: "manage-root-admin",
      label: "Manage Root Admin",
      icon: ShieldCheck,
      onClick: onManageRootAdmin,
      show: () => isCurrentUserRootAdmin
    },
    {
      key: "view-orgs",
      label: "View Organizations",
      icon: Building,
      onClick: onViewOrganizations
    },
    {
      key: "edit",
      label: "Edit User",
      icon: Edit,
      onClick: onEditUser,
      separator: true
    },
    {
      key: "delete",
      label: "Delete User",
      icon: Trash2,
      onClick: onDeleteUser,
      destructive: true
    }
  ]

  // Define footer stats
  const footerStats: FooterStat[] = [
    {
      label: `Showing ${users.length} users`,
      value: ''
    },
    {
      label: 'active users',
      value: users.filter(u => u.status === 'active').length
    }
  ]

  return (
    <DataTable
      data={users}
      columns={columns}
      actions={actions}
      getRowKey={(user) => user.id}
      emptyState={{
        icon: Users,
        title: "No users found",
        description: "No users have been created yet or match your search criteria."
      }}
      footerStats={footerStats}
      pagination={pagination}
      showFooterStats={showFooterStats}
    />
  )
}