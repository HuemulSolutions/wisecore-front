import { ChevronRight, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslation } from 'react-i18next'
import i18n from "@/i18n"
import { type User } from "@/types/users"
import { HuemulTable, type HuemulTableColumn } from "@/huemul/components/huemul-table"
import { useRolesMap } from "@/contexts/role-refs-context"
import { roleRowSwatch } from "@/lib/reference-colors"
import type { UserTableProps } from '@/types/users'
export type { UserTableProps } from '@/types/users'

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
      return 'bg-[#eefbf1] text-[#15803d] border-[#cdefd7]'
    case 'inactive':
      return 'bg-red-100/80 text-red-700 border-red-200'
    case 'pending':
      return 'bg-yellow-100/80 text-yellow-700 border-yellow-200'
    default:
      return 'bg-gray-100/80 text-gray-700 border-gray-200'
  }
}

function getInitials(user: User) {
  return `${user.name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
}

export default function UserTable({
  users,
  selectedUsers,
  onUserSelection,
  onSelectAll,
  onSelectUser,
  selectedUserId,
  canListRoles = false,
  pagination,
  isLoading = false,
  isFetching = false
}: UserTableProps) {
  const { t } = useTranslation(['users', 'common'])
  const { byId: rolesById } = useRolesMap(canListRoles)

  const columns: HuemulTableColumn<User>[] = [
    {
      key: "name",
      label: t('common:name'),
      width: "minmax(0,1.15fr)",
      render: (user) => (
        <div className="flex items-center gap-2.5">
          <Avatar>
            {user.photo_url && <AvatarImage src={user.photo_url} alt={user.name} />}
            <AvatarFallback className="bg-[#475569] text-xs font-semibold text-white">{getInitials(user)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0">
            <span className="truncate text-[13.5px] font-semibold leading-tight text-[#0f172a]">
              {user.name} {user.last_name}
            </span>
            <span className="truncate text-xs leading-tight text-[#7c8798]">
              {user.email}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "roles",
      label: t('users:columns.roles'),
      width: "minmax(0,1.25fr)",
      render: (user) => {
        if (!user.roles || user.roles.length === 0) {
          return <span className="text-xs italic text-[#9aa6b5]">{t('users:columns.noRoles')}</span>
        }
        const visible = user.roles.slice(0, 2)
        const remaining = user.roles.length - visible.length
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {visible.map((role) => {
              const swatch = roleRowSwatch(rolesById[role.id]?.color)
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectUser(user, 'roles')
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-[#e3e9f1] bg-white px-2.5 py-0.5 text-[11.5px] font-medium text-[#475569] hover:cursor-pointer hover:border-primary/40"
                >
                  <span className="size-1.75 shrink-0 rounded-full" style={{ backgroundColor: swatch.color }} />
                  <span className="max-w-32 truncate">{role.name}</span>
                </button>
              )
            })}
            {remaining > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectUser(user, 'roles')
                }}
                className="rounded-full border border-[#e3e9f1] bg-white px-2 py-0.5 text-[11.5px] font-medium text-[#475569] hover:cursor-pointer hover:border-primary/40"
              >
                +{remaining}
              </button>
            )}
          </div>
        )
      }
    },
    {
      key: "status",
      label: t('common:status'),
      width: "104px",
      render: (user) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusColor(user.status)}`}>
          {t(`common:${user.status}`, { defaultValue: user.status })}
        </span>
      )
    },
    {
      key: "chevron",
      label: "",
      align: "right",
      width: "40px",
      render: () => <ChevronRight className="ml-auto size-[15px] text-[#b6c0cd]" />
    }
  ]

  return (
    <HuemulTable
      variant="detailed"
      data={users}
      columns={columns}
      getRowKey={(user) => user.id}
      selectable
      selectedKeys={selectedUsers}
      onSelectionChange={(keys) => {
        // `onSelectionChange` entrega el Set completo; el estado de la página
        // sigue expresado como toggle por id (`onUserSelection`) + "seleccionar
        // todos" (`onSelectAll`), así que se traduce acá sin duplicar lógica.
        if (keys.size === users.length) {
          if (selectedUsers.size !== users.length) onSelectAll()
          return
        }
        if (keys.size === 0 && selectedUsers.size === users.length) {
          onSelectAll()
          return
        }
        const added = [...keys].find((id) => !selectedUsers.has(id))
        const removed = [...selectedUsers].find((id) => !keys.has(id))
        if (added) onUserSelection(added)
        else if (removed) onUserSelection(removed)
      }}
      onRowClick={(user) => onSelectUser(user)}
      activeKey={selectedUserId ?? null}
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
