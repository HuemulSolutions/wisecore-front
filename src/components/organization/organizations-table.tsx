import { Building2, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { HuemulTable, type HuemulTableColumn } from "@/huemul/components/huemul-table"
import i18n from "@/i18n"
import type { Organization, OrganizationsTableProps } from "@/types/organizations"
export type { OrganizationsTableProps } from "@/types/organizations"

// Helper de fecha — espejo del de `organization-table.tsx` (no compartido a
// propósito: es la única línea en común entre las dos tablas).
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Tabla maestro-detalle de `/organizations`: fila clickeable (`variant`
 * "detailed" + chevron), sin kebab de acciones ni checkbox de selección —
 * Eliminar vive en el footer del panel de detalle, no acá. Ver
 * ia context/list-detail-panel-guide.md. Distinta de `OrganizationTable`
 * (la de /global-admin, con kebab): los dos modos son mutuamente excluyentes.
 */
export function OrganizationsTable({
  organizations,
  isTableLoading = false,
  isTableFetching = false,
  onSelectOrganization,
  selectedOrganizationId,
  pagination,
}: OrganizationsTableProps) {
  const { t } = useTranslation(['organizations', 'common'])

  const columns: HuemulTableColumn<Organization>[] = [
    {
      key: "name",
      label: t('common:name'),
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
    {
      key: "created_at",
      label: t('common:created'),
      render: (organization) => (
        <div className="text-xs text-muted-foreground">
          {organization.created_at ? formatDate(organization.created_at) : "N/A"}
        </div>
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
      data={organizations}
      columns={columns}
      getRowKey={(org) => org.id}
      onRowClick={(organization) => onSelectOrganization(organization)}
      activeKey={selectedOrganizationId ?? null}
      emptyState={{
        icon: Building2,
        title: t('table.noOrgsFound'),
        description: t('table.noOrgsFoundDescription')
      }}
      pagination={pagination}
      isLoading={isTableLoading}
      isFetching={isTableFetching}
    />
  )
}
