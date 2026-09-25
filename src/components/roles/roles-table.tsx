import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, ChevronRight } from "lucide-react"
import { type Role } from "@/services/rbac"
import { HuemulTable, type HuemulTableColumn } from "@/huemul/components/huemul-table"
import { roleRowSwatch } from "@/lib/reference-colors"
import type { RolesTableProps } from '@/types/roles'
export type { RolesTableProps } from '@/types/roles'

export function RolesTable({
  roles,
  isTableLoading = false,
  isTableFetching = false,
  onSelectRole,
  selectedRoleId,
  rolesById = {},
  pagination,
  selectedIds,
  onSelectionChange
}: RolesTableProps) {
  const { t } = useTranslation(['roles', 'common'])

  const columns: HuemulTableColumn<Role>[] = [
    {
      key: "name",
      label: t('columns.roleName'),
      render: (role) => {
        const swatch = roleRowSwatch(role.color)
        return (
          <div className="flex flex-col gap-0">
            <div className="flex items-center gap-1.5">
              <span className="size-1.75 shrink-0 rounded-full" style={{ backgroundColor: swatch.color }} />
              <span className="text-xs font-medium text-foreground leading-tight">{role.name}</span>
            </div>
            {role.description && (
              <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">
                {role.description}
              </span>
            )}
          </div>
        )
      }
    },
    {
      key: "permissions",
      label: t('columns.permissions'),
      render: (role) => {
        const permissionCount = role.permission_num || role.permissions?.length || 0
        return (
          <Badge className="text-[10px] px-1.5 py-0 h-5" variant="outline">
            {permissionCount}
          </Badge>
        )
      }
    },
    {
      key: "users",
      label: t('columns.users'),
      render: (role) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelectRole(role, 'users')
          }}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:cursor-pointer hover:text-primary hover:underline"
        >
          <Users className="size-3" />
          {role.users_count ?? 0}
        </button>
      )
    },
    {
      key: "hierarchy",
      label: t('columns.hierarchy'),
      hideOnMobile: true,
      render: (role) => {
        if (!role.is_position) return <span className="text-xs text-muted-foreground">—</span>
        const parentName = role.parent_role_id ? rolesById[role.parent_role_id]?.name : null
        return (
          <div
            className="flex flex-col gap-0.5"
            onClick={(e) => {
              e.stopPropagation()
              onSelectRole(role, 'hierarchy')
            }}
          >
            <Badge variant="outline" className="w-fit text-[10px] px-1.5 py-0 h-5">
              {t('detail.positionBadge')}
            </Badge>
            {parentName && (
              <span className="text-[10px] text-muted-foreground">↳ {parentName}</span>
            )}
          </div>
        )
      }
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
      data={roles}
      columns={columns}
      getRowKey={(role) => role.id}
      onRowClick={(role) => onSelectRole(role)}
      activeKey={selectedRoleId}
      emptyState={{
        icon: Shield,
        title: t('emptyState.noRolesFound'),
        description: t('emptyState.noRolesCreated'),
      }}
      pagination={pagination}
      isLoading={isTableLoading}
      isFetching={isTableFetching}
      selectable={!!onSelectionChange}
      selectedKeys={selectedIds}
      onSelectionChange={onSelectionChange}
    />
  )
}
