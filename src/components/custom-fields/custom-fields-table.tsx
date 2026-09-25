import { ChevronRight, Settings2 } from "lucide-react"
import type { CustomField, CustomFieldTableProps } from '@/types/custom-fields'
export type { CustomFieldTableProps } from '@/types/custom-fields'
import { HuemulTable, type HuemulTableColumn } from "@/huemul/components/huemul-table"
import { useTranslation } from "react-i18next"
import { questionTypeLabel } from "@/components/sections/question-type-meta"
import { formatDate } from "@/components/users"

export function CustomFieldTable({
  customFields,
  onSelectCustomField,
  selectedCustomFieldId,
  pagination,
  canUpdate = false,
  canDelete = false,
  isLoading = false,
  isFetching = false
}: CustomFieldTableProps) {
  const { t } = useTranslation(['custom-fields', 'common'])
  const { t: tSections } = useTranslation('sections')

  const formatDataType = (dataType: string) => {
    const key = dataType as keyof object
    return t(`dataTypes.${key}` as Parameters<typeof t>[0], { defaultValue: dataType })
  }

  // El único punto de entrada para borrar es el sheet de edición
  // (custom-fields-create-edit-sheet.tsx), así que la fila se abre con
  // canUpdate O canDelete — restringirla solo a canUpdate le quitaría a un
  // rol con únicamente custom_fields:d toda forma de eliminar.
  const canOpen = canUpdate || canDelete

  const columns: HuemulTableColumn<CustomField>[] = [
    {
      key: "name",
      label: t('common:name'),
      width: "minmax(0,1.4fr)",
      render: (customField) => (
        <div className="flex min-w-0 flex-col gap-0">
          <span className="truncate text-[13.5px] font-semibold leading-tight text-[#0f172a]">
            {customField.name}
          </span>
          <span
            className="truncate text-xs leading-tight text-[#7c8798]"
            title={customField.description || undefined}
          >
            {customField.description || t('columns.noDescription')}
          </span>
        </div>
      )
    },
    {
      key: "fieldType",
      label: t('columns.fieldType'),
      width: "minmax(0,0.9fr)",
      render: (customField) => (
        <span className="inline-flex max-w-full items-center rounded-full border border-[#e3e9f1] bg-white px-2.5 py-0.5 text-[11.5px] font-medium text-[#475569]">
          <span className="truncate">
            {customField.question_type
              ? questionTypeLabel(customField.question_type, tSections)
              : formatDataType(customField.data_type)}
          </span>
        </span>
      )
    },
    {
      key: "mask",
      label: t('columns.mask'),
      width: "minmax(0,0.7fr)",
      render: (customField) =>
        customField.masc ? (
          <code className="rounded border bg-muted px-1.5 py-0.5 text-[11.5px]">
            {customField.masc}
          </code>
        ) : (
          <span className="text-xs italic text-[#9aa6b5]">{t('columns.none')}</span>
        )
    },
    {
      key: "created",
      label: t('common:created'),
      width: "120px",
      render: (customField) => (
        <span className="text-xs text-[#7c8798]">{formatDate(customField.created_at)}</span>
      )
    },
    {
      key: "chevron",
      label: "",
      align: "right",
      width: "40px",
      render: () =>
        canOpen ? <ChevronRight className="ml-auto size-[15px] text-[#b6c0cd]" /> : null
    }
  ]

  return (
    <HuemulTable
      variant="detailed"
      data={customFields}
      columns={columns}
      getRowKey={(customField) => customField.id}
      onRowClick={canOpen ? onSelectCustomField : undefined}
      activeKey={selectedCustomFieldId ?? null}
      emptyState={{
        icon: Settings2,
        title: t('contentEmptyState.tableEmptyTitle'),
        description: t('contentEmptyState.tableEmptyDescription')
      }}
      pagination={pagination}
      isLoading={isLoading}
      isFetching={isFetching}
    />
  )
}
