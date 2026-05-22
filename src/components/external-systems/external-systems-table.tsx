import { Edit2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ExternalSystem } from "@/types/external-systems"
import {
  HuemulTable,
  type HuemulTableColumn,
  type HuemulTableAction,
} from "@/huemul/components/huemul-table"
import { Badge } from "@/components/ui/badge"
import type { ExternalSystemsTableProps } from "@/types/external-systems-table"

export type { ExternalSystemsTableProps } from "@/types/external-systems-table"

export function ExternalSystemsTable({
  systems,
  onEdit,
  onDelete,
  isLoading = false,
  isFetching = false,
  pagination,
  searchTerm = "",
}: ExternalSystemsTableProps) {
  const { t } = useTranslation(["external-systems", "common"])

  const columns: HuemulTableColumn<ExternalSystem>[] = [
    {
      key: "name",
      label: t("common:name"),
      render: (system) => (
        <span className="text-xs font-medium text-foreground">{system.name}</span>
      ),
    },
    {
      key: "base_url",
      label: t("columns.baseUrl"),
      render: (system) => (
        <span className="text-xs text-muted-foreground truncate max-w-48 block">
          {system.base_url}
        </span>
      ),
    },
    {
      key: "status",
      label: t("common:status"),
      render: (system) => (
        <Badge
          variant={system.status === "active" ? "default" : "secondary"}
          className="text-xs"
        >
          {system.status === "active" ? t("common:active") : t("common:inactive")}
        </Badge>
      ),
    },
    {
      key: "updated_at",
      label: t("common:updated"),
      render: (system) => (
        <span className="text-xs text-muted-foreground">
          {new Date(system.updated_at).toLocaleDateString()}
        </span>
      ),
    },
  ]

  const actions: HuemulTableAction<ExternalSystem>[] = [
    {
      key: "edit",
      label: t("actions.edit"),
      icon: Edit2,
      onClick: onEdit,
      separator: true,
    },
    {
      key: "delete",
      label: t("actions.delete"),
      icon: Trash2,
      onClick: onDelete,
      destructive: true,
    },
  ]

  return (
    <HuemulTable
      data={systems}
      columns={columns}
      actions={actions}
      getRowKey={(system) => system.id}
      isLoading={isLoading}
      isFetching={isFetching}
      pagination={pagination}
      emptyState={{
        title: searchTerm
          ? t("emptyState.noResults")
          : t("emptyState.empty"),
        description: searchTerm ? undefined : t("list.emptyDescription"),
      }}
    />
  )
}
