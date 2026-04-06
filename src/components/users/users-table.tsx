import { Badge } from "@/components/ui/badge"
import { useTranslation } from 'react-i18next'
import i18n from "@/i18n"
import { Trash2, Check, X, Edit, Shield, Users, Building, UserPlus, ShieldCheck } from "lucide-react"
import { type User } from "@/types/users"
import { type UseMutationResult } from "@tanstack/react-query"
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction, type HuemulTablePagination } from "@/huemul/components/huemul-table"

// Helper functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(i18n.language, {
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
  onMakeOrganizationAdmin?: (user: User) => void
  isCurrentUserRootAdmin?: boolean
  userMutations: {
    approveUser: UseMutationResult<any, any, string, unknown>
    rejectUser: UseMutationResult<any, any, string, unknown>
    deleteUser: UseMutationResult<any, any, string, unknown>
  }
  pagination?: HuemulTablePagination
  canUpdate?: boolean
  canDelete?: boolean
  isLoading?: boolean
  isFetching?: boolean
}

export default function UserTable({
  users,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedUsers: _selectedUsers,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUserSelection: _onUserSelection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelectAll: _onSelectAll,
  onEditUser,
  onViewOrganizations,
  onAssignRoles,
  onDeleteUser,
  onManageRootAdmin,
  onMakeOrganizationAdmin,
  isCurrentUserRootAdmin = false,
  userMutations,
  pagination,
  canUpdate = false,
  canDelete = false,
  isLoading = false,
  isFetching = false
}: UserTableProps) {
  const { t } = useTranslation(['users'])

  // Define columns
  const columns: HuemulTableColumn<User>[] = [
    {
      key: "name",
      label: t('users:columns.name'),
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
      label: t('common:email'),
      render: (user) => (
        <span className="text-xs text-blue-600 font-medium">{user.email}</span>
      )
    },
    {
      key: "birthday",
      label: t('users:columns.birthday'),
      render: (user) => {
        if (!user.birth_day || !user.birth_month) return <span className="text-xs text-foreground">N/A</span>
        const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
        const monthName = t(`users:form.months.${monthKeys[user.birth_month - 1]}`)
        return <span className="text-xs text-foreground">{monthName} {user.birth_day}</span>
      }
    },
    {
      key: "roles",
      label: t('users:columns.roles'),
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
        return <span className="text-[10px] text-muted-foreground">{t('users:columns.noRoles')}</span>
      }
    },
    {
      key: "status",
      label: t('common:status'),
      render: (user) => (
        <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(user.status)}`}>
          {t(`users:status.${user.status}`, { defaultValue: user.status })}
        </Badge>
      )
    },
    {
      key: "created",
      label: t('users:columns.created'),
      render: (user) => (
        <span className="text-xs text-foreground">{formatDate(user.created_at)}</span>
      )
    }
  ]

  // Define actions - note: conditional actions using show property
  const actions: HuemulTableAction<User>[] = [
    {
      key: "approve",
      label: t('users:actions.approveUser'),
      icon: Check,
      onClick: (user) => userMutations.approveUser.mutate(user.id),
      show: (user) => user.status === 'pending' && canUpdate,
      className: "text-green-600"
    },
    {
      key: "reject",
      label: t('users:actions.rejectUser'),
      icon: X,
      onClick: (user) => userMutations.rejectUser.mutate(user.id),
      show: (user) => user.status === 'pending' && canUpdate,
      separator: true,
      destructive: true
    },
    {
      key: "assign-roles",
      label: t('users:actions.assignRoles'),
      icon: UserPlus,
      onClick: onAssignRoles,
      show: () => canUpdate
    },
    {
      key: "manage-root-admin",
      label: t('users:actions.manageRootAdmin'),
      icon: ShieldCheck,
      onClick: onManageRootAdmin,
      show: () => isCurrentUserRootAdmin
    },
    {
      key: "make-org-admin",
      label: t('users:actions.makeOrgAdmin'),
      icon: Building,
      onClick: (user) => onMakeOrganizationAdmin?.(user),
      show: () => isCurrentUserRootAdmin && !!onMakeOrganizationAdmin,
      separator: true
    },
    {
      key: "view-orgs",
      label: t('users:actions.viewOrganizations'),
      icon: Building,
      onClick: onViewOrganizations
      ,
      show: () => false
    },
    {
      key: "edit",
      label: t('users:actions.editUser'),
      icon: Edit,
      onClick: onEditUser,
      show: () => canUpdate,
      separator: true
    },
    {
      key: "delete",
      label: t('users:actions.deleteUser'),
      icon: Trash2,
      onClick: onDeleteUser,
      show: () => canDelete,
      destructive: true
    }
  ]

  return (
    <HuemulTable
      data={users}
      columns={columns}
      actions={actions}
      getRowKey={(user) => user.id}
      emptyState={{
        icon: Users,
        title: t('users:emptyState.title'),
        description: t('users:emptyState.description')
      }}
      pagination={pagination}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  )
}
