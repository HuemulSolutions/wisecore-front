import { Edit2, Trash2 } from "lucide-react"
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

const getTypeDisplayName = (type: string) => {
  switch (type) {
    case "internal":
      return "Internal"
    case "entra":
      return "Entra ID (SAML2)"
    default:
      return type
  }
}

export function AuthTypesTable({ 
  authTypes, 
  filteredAuthTypes, 
  onEdit, 
  onDelete 
}: AuthTypesTableProps) {
  const { isRootAdmin } = useUserPermissions()

  // Define columns
  const columns: TableColumn<AuthType>[] = [
    {
      key: "name",
      label: "Name",
      render: (authType) => (
        <span className="text-xs font-medium text-foreground">{authType.name}</span>
      )
    },
    {
      key: "type",
      label: "Type",
      render: (authType) => (
        <span className="text-xs text-foreground">{getTypeDisplayName(authType.type)}</span>
      )
    },
    {
      key: "created",
      label: "Created",
      render: (authType) => (
        <span className="text-xs text-foreground">
          {new Date(authType.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "updated",
      label: "Updated",
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
      label: "Edit Auth Type",
      icon: Edit2,
      onClick: onEdit,
      separator: true
    },
    {
      key: "delete",
      label: "Delete Auth Type",
      icon: Trash2,
      onClick: onDelete,
      destructive: true
    }
  ] : []

  // Define footer stats
  const footerStats: FooterStat[] = [
    {
      label: `Showing ${filteredAuthTypes.length} of ${authTypes.length} authentication types`,
      value: ''
    },
    {
      label: 'internal types',
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