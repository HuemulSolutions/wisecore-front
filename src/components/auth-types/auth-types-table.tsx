import { Edit2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { AuthType } from "@/services/auth-types"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn, TableAction, FooterStat } from "@/types/data-table"
import { useUserPermissions } from "@/hooks/useUserPermissions"

interface AuthTypesTableProps {
  authTypes: AuthType[]
  filteredAuthTypes: AuthType[]
  onEdit: (authType: AuthType) => void
  onDelete: (authType: AuthType) => void
}


export function AuthTypesTable({ 
  authTypes, 
  filteredAuthTypes, 
  onEdit, 
  onDelete 
}: AuthTypesTableProps) {
  const { t } = useTranslation(['auth-types', 'common'])
  const { isRootAdmin } = useUserPermissions()

  // Define columns
  const columns: TableColumn<AuthType>[] = [
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
      label: t('columns.created'),
      render: (authType) => (
        <span className="text-xs text-foreground">
          {new Date(authType.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "updated",
      label: t('columns.updated'),
      render: (authType) => (
        <span className="text-xs text-foreground">
          {new Date(authType.updated_at).toLocaleDateString()}
        </span>
      )
    }
  ]

  // Define actions (solo para admins)
  const actions: TableAction<AuthType>[] = isRootAdmin ? [
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

  // Define footer stats
  const footerStats: FooterStat[] = [
    {
      label: t('footer.showing', { filtered: filteredAuthTypes.length, total: authTypes.length }),
      value: ''
    },
    {
      label: t('footer.internalTypes'),
      value: authTypes.filter(a => a.type === 'internal').length
    }
  ]

  return (
    <DataTable
      data={filteredAuthTypes}
      columns={columns}
      actions={actions}
      getRowKey={(authType) => authType.id}
      footerStats={footerStats}
      maxHeight="max-h-[70vh]"
    />
  )
}