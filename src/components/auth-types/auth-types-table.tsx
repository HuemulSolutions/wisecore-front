import { Edit2, Trash2, Shield } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { AuthType } from "@/services/auth-types"
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction } from "@/huemul/components/huemul-table"
import type { AuthTypesTableProps } from '@/types/auth-types'

export type { AuthTypesTableProps } from '@/types/auth-types'

export function AuthTypesTable({
  authTypes,
  onEdit,
  onDelete,
  isLoading = false,
  isFetching = false,
  pagination,
  canManage = false,
}: AuthTypesTableProps) {
  const { t } = useTranslation(['auth-types', 'common'])

  const columns: HuemulTableColumn<AuthType>[] = [
    {
      key: "name",
      label: t('common:name'),
      render: (authType) => (
        <span className="text-xs font-medium text-foreground">{authType.name}</span>
      )
    },
    {
      key: "type",
      label: t('columns.type'),
      render: (authType) => (
        <span className="text-xs text-foreground">
          {authType.type === 'internal' ? t('types.internal') : authType.type === 'entra' ? t('types.entra') : authType.type}
        </span>
      )
    },
    {
      key: "created",
      label: t('common:created'),
      render: (authType) => (
        <span className="text-xs text-foreground">
          {new Date(authType.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "updated",
      label: t('common:updated'),
      render: (authType) => (
        <span className="text-xs text-foreground">
          {new Date(authType.updated_at).toLocaleDateString()}
        </span>
      )
    }
  ]

  const actions: HuemulTableAction<AuthType>[] = canManage ? [
    {
      key: "edit",
      label: t('actions.editAuthType'),
      icon: Edit2,
      onClick: onEdit,
      separator: true
    },
    {
      key: "delete",
      label: t('actions.deleteAuthType'),
      icon: Trash2,
      onClick: onDelete,
      destructive: true
    }
  ] : []

  return (
    <HuemulTable
      data={authTypes}
      columns={columns}
      actions={actions}
      getRowKey={(authType) => authType.id}
      emptyState={{
        icon: Shield,
        title: t('emptyState.empty'),
        description: t('emptyState.noResults'),
      }}
      isLoading={isLoading}
      isFetching={isFetching}
      pagination={pagination}
    />
  )
}