import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, FileText } from "lucide-react"
import type { CustomField } from "@/types/custom-fields"
import type { useCustomFieldMutations } from "@/hooks/useCustomFields"
import { DataTable, type PaginationConfig } from "@/components/ui/data-table"
import type { TableColumn, TableAction, FooterStat } from "@/types/data-table"

interface CustomFieldTableProps {
  customFields: CustomField[]
  selectedCustomFields: Set<string>
  onCustomFieldSelection: (customFieldId: string) => void
  onSelectAll: () => void
  onEditCustomField: (customField: CustomField) => void
  onDeleteCustomField: (customField: CustomField) => void
  customFieldMutations: ReturnType<typeof useCustomFieldMutations>
  pagination?: PaginationConfig
  showFooterStats?: boolean
  canManage?: boolean
}

const formatDataType = (dataType: string) => {
  switch (dataType) {
    case "string":
      return "Text"
    case "int":
      return "Integer"
    case "decimal":
      return "Decimal"
    case "date":
      return "Date"
    case "time":
      return "Time"
    case "datetime":
      return "Date Time"
    case "bool":
      return "Boolean"
    case "image":
      return "Image"
    case "url":
      return "URL"
    default:
      return dataType
  }
}

// Helper function for date formatting
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function CustomFieldTable({
  customFields,
  selectedCustomFields,
  onCustomFieldSelection,
  onSelectAll,
  onEditCustomField,
  onDeleteCustomField,
  pagination,
  showFooterStats,
  canManage = false
}: CustomFieldTableProps) {
  // Define columns
  const columns: TableColumn<CustomField>[] = [
    {
      key: "name",
      label: "Name",
      render: (customField) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">{customField.name}</span>
          <span className="text-[10px] text-muted-foreground">
            ID: {customField.id}
          </span>
        </div>
      )
    },
    {
      key: "description",
      label: "Description",
      render: (customField) => (
        <div className="max-w-xs truncate text-xs text-foreground" title={customField.description}>
          {customField.description || "No description"}
        </div>
      )
    },
    {
      key: "dataType",
      label: "Data Type",
      render: (customField) => (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {formatDataType(customField.data_type)}
        </Badge>
      )
    },
    {
      key: "mask",
      label: "Mask",
      render: (customField) => (
        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">
          {customField.masc || "None"}
        </code>
      )
    },
    {
      key: "created",
      label: "Created",
      render: (customField) => (
        <span className="text-xs text-foreground">{formatDate(customField.created_at)}</span>
      )
    }
  ]

  // Define actions - solo si es admin
  const actions: TableAction<CustomField>[] = canManage ? [
    {
      key: "edit",
      label: "Edit Custom Field",
      icon: Edit2,
      onClick: onEditCustomField,
      separator: true
    },
    {
      key: "delete",
      label: "Delete Custom Field",
      icon: Trash2,
      onClick: onDeleteCustomField,
      destructive: true
    }
  ] : []

  // Define footer stats
  const footerStats: FooterStat[] = [
    {
      label: `Showing ${customFields.length} custom field${customFields.length !== 1 ? 's' : ''}`,
      value: ''
    },
    {
      label: 'selected',
      value: selectedCustomFields.size
    }
  ]

  return (
    <DataTable
      data={customFields}
      columns={columns}
      actions={actions}
      getRowKey={(customField) => customField.id}
      emptyState={{
        icon: FileText,
        title: "No custom fields found",
        description: "No custom fields have been created yet or match your search criteria."
      }}
      footerStats={footerStats}
      showCheckbox={true}
      selectedItems={selectedCustomFields}
      onItemSelection={onCustomFieldSelection}
      onSelectAll={onSelectAll}
      pagination={pagination}
      showFooterStats={showFooterStats}
    />
  )
}