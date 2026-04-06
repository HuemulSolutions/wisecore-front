import { Edit2, Trash2, Building2, Shield } from "lucide-react"
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction, type HuemulTablePagination } from "@/huemul/components/huemul-table"
import { useTranslation } from "react-i18next"
import i18n from "@/i18n"

export interface Organization {
  id: string
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
  max_users?: number | null
  token_limit?: number | null
}

interface OrganizationTableProps {
  organizations: Organization[]
  onEditOrganization: (organization: Organization) => void
  onDeleteOrganization: (organization: Organization) => void
  onSetAdmin?: (organization: Organization) => void
  pagination?: HuemulTablePagination
  canUpdate?: boolean
  canDelete?: boolean
  canSetAdmin?: boolean
  isRootAdmin?: boolean
  maxHeight?: string
  isLoading?: boolean
  isFetching?: boolean
}

// Helper function for date formatting
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function OrganizationTable({
  organizations,
  onEditOrganization,
  onDeleteOrganization,
  onSetAdmin,
  pagination,
  canUpdate = false,
  canDelete = false,
  canSetAdmin = false,
  isRootAdmin = false,
  maxHeight,
  isLoading = false,
  isFetching = false
}: OrganizationTableProps) {
  const { t } = useTranslation('organizations')

  // Define columns
  const columns: HuemulTableColumn<Organization>[] = [
    {
      key: "name",
      label: t('columns.name'),
      render: (organization) => (
        <div className="flex items-center gap-3">
          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-foreground truncate">
              {organization.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ID: {organization.id}
            </span>
          </div>
        </div>
      )
    },
    {
      key: "description",
      label: t('columns.description'),
      render: (organization) => (
        <div
          className="max-w-xs truncate text-xs text-foreground"
          title={organization.description || undefined}
        >
          {organization.description || t('columns.noDescription')}
        </div>
      )
    },
    ...(isRootAdmin ? [
      {
        key: "max_users" as const,
        label: t('columns.maxUsers'),
        render: (organization: Organization) => (
          <div className="text-xs text-foreground">
            {organization.max_users ?? t('columns.unlimited')}
          </div>
        )
      },
      {
        key: "token_limit" as const,
        label: t('columns.tokenLimit'),
        render: (organization: Organization) => (
          <div className="text-xs text-foreground">
            {organization.token_limit ? organization.token_limit.toLocaleString() : t('columns.unlimited')}
          </div>
        )
      }
    ] : []),
    {
      key: "created_at",
      label: t('columns.createdAt'),
      render: (organization) => (
        <div className="text-xs text-muted-foreground">
          {organization.created_at ? formatDate(organization.created_at) : "N/A"}
        </div>
      )
    }
  ]

  // Define actions - basado en permisos específicos
  const actions: HuemulTableAction<Organization>[] = [
    ...(canSetAdmin && onSetAdmin ? [{
      key: "setAdmin" as const,
      label: t('actions.setAdmin'),
      icon: Shield,
      onClick: onSetAdmin
    }] : []),
    ...(canUpdate ? [{
      key: "edit" as const,
      label: t('actions.edit'),
      icon: Edit2,
      onClick: onEditOrganization
    }] : []),
    ...(canDelete ? [{
      key: "delete" as const,
      label: t('actions.delete'),
      icon: Trash2,
      onClick: onDeleteOrganization,
      destructive: true
    }] : [])
  ]

  return (
    <HuemulTable
      data={organizations}
      columns={columns}
      actions={actions}
      getRowKey={(org) => org.id}
      emptyState={{
        icon: Building2,
        title: t('table.noOrgsFound'),
        description: t('table.noOrgsFoundDescription')
      }}
      pagination={pagination}
      maxHeight={maxHeight}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  )
}
