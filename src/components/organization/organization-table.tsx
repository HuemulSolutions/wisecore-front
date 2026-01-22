import { Edit2, Trash2, Building2 } from "lucide-react"
import { DataTable, type PaginationConfig } from "@/components/ui/data-table"
import type { TableColumn, TableAction, FooterStat, EmptyState } from "@/types/data-table"

export interface Organization {
  id: string
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

interface OrganizationTableProps {
  organizations: Organization[]
  selectedOrganizations: Set<string>
  onOrganizationSelection: (organizationId: string) => void
  onSelectAll: () => void
  onEditOrganization: (organization: Organization) => void
  onDeleteOrganization: (organization: Organization) => void
  pagination?: PaginationConfig
  showFooterStats?: boolean
  canUpdate?: boolean
  canDelete?: boolean
}

// Helper function for date formatting
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function OrganizationTable({
  organizations,
  selectedOrganizations,
  onOrganizationSelection,
  onSelectAll,
  onEditOrganization,
  onDeleteOrganization,
  pagination,
  showFooterStats,
  canUpdate = false,
  canDelete = false
}: OrganizationTableProps) {
  // Define columns
  const columns: TableColumn<Organization>[] = [
    {
      key: "name",
      label: "Name",
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
      label: "Description",
      render: (organization) => (
        <div 
          className="max-w-xs truncate text-xs text-foreground" 
          title={organization.description || undefined}
        >
          {organization.description || "No description"}
        </div>
      )
    },
    {
      key: "created_at",
      label: "Created At",
      render: (organization) => (
        <div className="text-xs text-muted-foreground">
          {organization.created_at ? formatDate(organization.created_at) : "N/A"}
        </div>
      )
    }
  ]

  // Define actions - basado en permisos específicos
  const actions: TableAction<Organization>[] = [
    ...(canUpdate ? [{
      key: "edit" as const,
      label: "Edit",
      icon: Edit2,
      onClick: onEditOrganization
    }] : []),
    ...(canDelete ? [{
      key: "delete" as const,
      label: "Delete",
      icon: Trash2,
      onClick: onDeleteOrganization,
      destructive: true
    }] : [])
  ]

  // Define empty state
  const emptyState: EmptyState = {
    icon: Building2,
    title: "No Organizations Found",
    description: "No organizations match your search criteria"
  }

  // Define footer stats
  const footerStatsList: FooterStat[] = showFooterStats ? [
    {
      label: "Total Organizations",
      value: organizations.length
    },
    {
      label: "Selected",
      value: selectedOrganizations.size
    }
  ] : []

  return (
    <DataTable<Organization>
      data={organizations}
      columns={columns}
      actions={actions}
      getRowKey={(org) => org.id}
      emptyState={emptyState}
      selectedItems={selectedOrganizations}
      onItemSelection={onOrganizationSelection}
      onSelectAll={onSelectAll}
      pagination={pagination}
      footerStats={footerStatsList}
      showCheckbox={canUpdate || canDelete}
      showFooterStats={showFooterStats}
    />
  )
}
