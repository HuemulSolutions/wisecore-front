import { Badge } from "@/components/ui/badge"
import { Edit2, FileText } from "lucide-react"
import type { CustomField, CustomFieldTableProps } from '@/types/custom-fields'
export type { CustomFieldTableProps } from '@/types/custom-fields'
import { HuemulTable, type HuemulTableColumn, type HuemulTableAction } from "@/huemul/components/huemul-table"
import { useTranslation } from "react-i18next"
import { questionTypeLabel } from "@/components/sections/question-type-meta"

export function CustomFieldTable({
  customFields,
  onEditCustomField,
  pagination,
  canManage = false,
  isLoading = false,
  isFetching = false
}: CustomFieldTableProps) {
  const { t, i18n } = useTranslation(['custom-fields', 'common'])
  const { t: tSections } = useTranslation('sections')

  const formatDataType = (dataType: string) => {
    const key = dataType as keyof object
    return t(`dataTypes.${key}` as Parameters<typeof t>[0], { defaultValue: dataType })
  }

  // Define columns
  const columns: HuemulTableColumn<CustomField>[] = [
    {
      key: "name",
      label: t('common:name'),
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
      key: "fieldType",
      label: t('columns.fieldType'),
      render: (customField) => (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {customField.question_type
            ? questionTypeLabel(customField.question_type, tSections)
            : formatDataType(customField.data_type)}
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
      label: t('common:created'),
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
  const actions: HuemulTableAction<CustomField>[] = canManage ? [
    {
      key: "edit",
      label: t('actions.editCustomField'),
      icon: Edit2,
      onClick: onEditCustomField,
    }
  ] : []

  return (
    <HuemulTable
      data={customFields}
      columns={columns}
      actions={actions}
      getRowKey={(customField) => customField.id}
      emptyState={{
        icon: FileText,
        title: t('contentEmptyState.tableEmptyTitle'),
        description: t('contentEmptyState.tableEmptyDescription')
      }}
      pagination={pagination}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  )
}