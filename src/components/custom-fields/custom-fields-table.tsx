import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, FileText } from "lucide-react"
import type { CustomField } from "@/types/custom-fields"
import type { useCustomFieldMutations } from "@/hooks/useCustomFields"
import { DataTable, type PaginationConfig } from "@/components/ui/data-table"
import type { TableColumn, TableAction, FooterStat } from "@/types/data-table"
import { useTranslation } from "react-i18next"

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
  const { t, i18n } = useTranslation('custom-fields')

  const formatDataType = (dataType: string) => {
    const key = dataType as keyof object
    return t(`dataTypes.${key}` as Parameters<typeof t>[0], { defaultValue: dataType })
  }

  // Define columns
  const columns: TableColumn<CustomField>[] = [
    {
      key: "name",
      label: t('columns.name'),
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
      label: t('columns.description'),
      render: (customField) => (
        <div className="max-w-xs truncate text-xs text-foreground" title={customField.description}>
          {customField.description || t('columns.noDescription')}
        </div>
      )
    },
    {
      key: "dataType",
      label: t('columns.dataType'),
      render: (customField) => (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {formatDataType(customField.data_type)}
        </Badge>
      )
    },
    {
      key: "mask",
      label: t('columns.mask'),
      render: (customField) => (
        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">
          {customField.masc || t('columns.none')}
        </code>
      )
    },
    {
      key: "created",
      label: t('columns.created'),
      render: (customField) => (
        <span className="text-xs text-foreground">
          {new Date(customField.created_at).toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </span>
      )
    }
  ]

  // Define actions - solo si es admin
  const actions: TableAction<CustomField>[] = canManage ? [
    {
      key: "edit",
      label: t('actions.editCustomField'),
      icon: Edit2,
      onClick: onEditCustomField,
      separator: true
    },
    {
      key: "delete",
      label: t('actions.deleteCustomField'),
      icon: Trash2,
      onClick: onDeleteCustomField,
      destructive: true
    }
  ] : []

  // Define footer stats
  const footerStats: FooterStat[] = [
    {
      label: customFields.length !== 1
        ? t('footer.showingPlural', { count: customFields.length })
        : t('footer.showing', { count: customFields.length }),
      value: ''
    },
    {
      label: t('footer.selected'),
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
        title: t('contentEmptyState.tableEmptyTitle'),
        description: t('contentEmptyState.tableEmptyDescription')
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