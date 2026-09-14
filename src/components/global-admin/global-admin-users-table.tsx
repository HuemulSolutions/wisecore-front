"use client"

import { useTranslation } from "react-i18next"
import { ChevronRight, Shield, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { HuemulTable, type HuemulTableColumn, type HuemulTablePagination } from "@/huemul/components/huemul-table"
import { formatDate, getStatusColor } from "@/components/users"
import type { User, UserDetailTab } from "@/types/users"

export interface GlobalAdminUsersTableProps {
  users: User[]
  isTableLoading?: boolean
  isTableFetching?: boolean
  onSelectUser: (user: User, tab?: UserDetailTab) => void
  selectedUserId?: string | null
  pagination?: HuemulTablePagination
}

/**
 * Tabla maestro-detalle de la pestaña Usuarios de `/global-admin` — mismas
 * columnas que la tabla con kebab que reemplaza (name+activated / email /
 * root-admin / status / created), pero `variant="detailed"` + chevron, sin
 * checkbox ni acciones: todo lo que antes vivía en el kebab (aprobar,
 * rechazar, editar, root admin, asignar organización) ahora es inline en
 * `UserDetailPanel`. Distinta de `UserTable` (org-scoped, columna de roles).
 */
export function GlobalAdminUsersTable({
  users,
  isTableLoading = false,
  isTableFetching = false,
  onSelectUser,
  selectedUserId,
  pagination,
}: GlobalAdminUsersTableProps) {
  const { t } = useTranslation(['users', 'global-admin', 'common'])

  const columns: HuemulTableColumn<User>[] = [
    {
      key: "name",
      label: t('common:name'),
      render: (user) => (
        <div className="flex flex-col gap-0">
          <span className="text-xs font-medium text-foreground leading-tight">
            {user.name} {user.last_name}
          </span>
          {user.activated_at && (
            <span className="text-[10px] text-muted-foreground leading-tight">
              {t('activated', { date: formatDate(user.activated_at) })}
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
      key: "root-admin",
      label: t('columns.rootAdmin'),
      render: (user) => (
        user.is_root_admin ? (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            <Shield className="w-2 h-2 mr-0.5" />
            {t('common:yes')}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">{t('common:no')}</span>
        )
      )
    },
    {
      key: "status",
      label: t('common:status'),
      render: (user) => (
        <Badge className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(user.status)}`}>
          {t(`common:${user.status}`, { defaultValue: user.status })}
        </Badge>
      )
    },
    {
      key: "created",
      label: t('common:created'),
      render: (user) => (
        <span className="text-xs text-foreground">{formatDate(user.created_at)}</span>
      )
    },
    {
      key: "chevron",
      label: "",
      align: "right",
      width: "40px",
      render: () => <ChevronRight className="ml-auto size-[15px] text-[#b6c0cd]" />
    },
  ]

  return (
    <HuemulTable
      variant="detailed"
      data={users}
      columns={columns}
      getRowKey={(user) => user.id}
      onRowClick={(user) => onSelectUser(user)}
      activeKey={selectedUserId ?? null}
      emptyState={{
        icon: Users,
        title: t('emptyState.title'),
        description: t('emptyState.description')
      }}
      pagination={pagination}
      isLoading={isTableLoading}
      isFetching={isTableFetching}
    />
  )
}
