"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { Edit2, Trash2, FileEdit } from "lucide-react"
import { questionTypeLabel } from "@/components/sections/question-type-meta"
import type { CustomFieldTemplate } from '@/types/custom-fields';
import type { CustomFieldTemplateTableProps } from '@/types/templates';
export type { CustomFieldTemplateTableProps } from '@/types/templates';

const getValueForDisplay = (template: CustomFieldTemplate) => {
  const dataType = template.data_type
  switch (dataType) {
    case "bool":
      return template.value_bool !== null ? (template.value_bool ? "True" : "False") : ""
    case "int":
      return template.value_number !== null ? template.value_number.toString() : ""
    case "decimal":
      return template.value_number !== null ? template.value_number.toString() : ""
    case "date":
      return template.value_date || ""
    case "time":
      return template.value_time || ""
    case "datetime":
      return template.value_datetime || ""
    case "url":
      return template.value_url || ""
    case "image":
      return template.value ? "Image uploaded" : ""
    case "list": {
      if (template.value_list && template.value_list.length > 0) {
        return template.value_list
          .map(id => template.options?.find(o => o.id === id)?.label ?? id)
          .join(", ")
      }
      const optionId = template.value_identifier
      if (!optionId) return ""
      const match = template.options?.find(o => o.id === optionId)
      return match ? match.label : optionId
    }
    default:
      return template.value_string || ""
  }
}

export function CustomFieldTemplateTable({
  customFieldTemplates,
  onEditCustomFieldTemplate,
  onEditContentCustomFieldTemplate,
  onDeleteCustomFieldTemplate,
  pagination,
}: CustomFieldTemplateTableProps) {
  const { t } = useTranslation(['templates', 'common', 'custom-fields'])
  const { t: tSections } = useTranslation('sections')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customFieldToDelete, setCustomFieldToDelete] = useState<CustomFieldTemplate | null>(null)
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null)

  // No need for local pagination anymore - data comes paginated from server

  const renderValueDisplay = (template: CustomFieldTemplate) => {
    const dataType = template.data_type
    
    if (dataType === "bool") {
      return (
        <div className="flex items-center gap-1.5">
          <Switch 
            checked={template.value_bool === true}
            disabled
            className="data-[state=checked]:bg-primary scale-75"
          />
        </div>
      )
    }

    if (dataType === "image") {
      const imageUrl = template.value
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        return (
          <div className="flex items-center gap-1.5">
            <img 
              src={imageUrl} 
              alt={template.name || t('customFields.table.image')}
              className="w-8 h-8 object-cover rounded border border-gray-200 hover:cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setSelectedImage({ url: imageUrl, name: template.name || t('customFields.table.image') })
                setImageDialogOpen(true)
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="text-xs text-gray-600 hidden">
              {t('customFields.table.errorLoadingImage')}
            </span>
          </div>
        )
      }
      return (
        <div className="text-xs text-muted-foreground">
          {t('customFields.table.noImage')}
        </div>
      )
    }

    const displayValue = getValueForDisplay(template)
    return (
      <div className="text-xs text-foreground max-w-xs truncate" title={displayValue}>
        {displayValue || t('customFields.table.noValueSet')}
      </div>
    )
  }

  const handleDeleteClick = (customField: CustomFieldTemplate) => {
    setCustomFieldToDelete(customField)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!customFieldToDelete) return

    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    await Promise.all([
      new Promise<void>((resolve) => {
        onDeleteCustomFieldTemplate(customFieldToDelete)
        resolve()
      }),
      minDelay
    ])
  }

  if (customFieldTemplates.length === 0) {
    return null
  }

  // Define columns
  const columns: TableColumn<CustomFieldTemplate>[] = [
    {
      key: "name",
      label: t('customFields.table.fieldName'),
      render: (template) => (
        <div className="text-xs font-medium text-foreground">
          {template.name}
        </div>
      ),
    },
    {
      key: "type",
      label: t('customFields.table.type'),
      render: (template) => (
        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
          {template.question_type
            ? questionTypeLabel(template.question_type, tSections)
            : t(`custom-fields:dataTypes.${template.data_type}` as Parameters<typeof t>[0], { defaultValue: template.data_type })}
        </Badge>
      ),
    },
    {
      key: "values",
      label: t('customFields.table.values'),
      render: (template) => renderValueDisplay(template),
    },
    {
      key: "required",
      label: t('customFields.table.required'),
      render: (template) => (
        <Switch
          checked={template.required}
          disabled
          className="data-[state=checked]:bg-primary scale-75"
        />
      ),
    },
    {
      key: "prompt",
      label: t('customFields.table.prompt'),
      render: (template) => (
        <div className="text-xs text-foreground max-w-xs truncate" title={template.prompt}>
          {template.prompt ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              {template.prompt}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      ),
    },
  ]

  // Define actions
  const actions: TableAction<CustomFieldTemplate>[] = [
    {
      key: "edit-content",
      label: t('customFields.table.editContent'),
      icon: FileEdit,
      onClick: onEditContentCustomFieldTemplate,
    },
    {
      key: "edit-configuration",
      label: t('customFields.table.editConfiguration'),
      icon: Edit2,
      onClick: onEditCustomFieldTemplate,
    },
    {
      key: "delete",
      label: t('common:delete'),
      icon: Trash2,
      onClick: handleDeleteClick,
      destructive: true,
      separator: true,
    },
  ]

  // Define footer stats
  const footerStats = [
    {
      label: t('customFields.table.fieldName'),
      value: customFieldTemplates.length.toString(),
    },
    {
      label: t('customFields.table.required'),
      value: customFieldTemplates.filter(field => field.required).length.toString(),
    },
  ]

  return (
    <>
      <DataTable
        data={customFieldTemplates}
        columns={columns}
        actions={actions}
        getRowKey={(template) => template.id.toString()}
        footerStats={footerStats}
        maxHeight="max-h-[600px]"
        pagination={pagination ? {
          page: pagination.page,
          pageSize: pagination.pageSize,
          hasNext: pagination.hasNext,
          hasPrevious: pagination.hasPrevious,
          onPageChange: pagination.onPageChange,
          onPageSizeChange: pagination.onPageSizeChange,
          pageSizeOptions: pagination.pageSizeOptions || DEFAULT_PAGE_SIZE_OPTIONS
        } : undefined}
        showFooterStats={false}
      />

      {/* Delete confirmation dialog */}
      <HuemulAlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setCustomFieldToDelete(null)
        }}
        title={t('customFields.table.deleteTitle')}
        description={t('customFields.table.deleteDescription', { name: customFieldToDelete?.name })}
        onAction={handleConfirmDelete}
        actionLabel={t('common:delete')}
        actionVariant="destructive"
      />

      {/* Image preview dialog */}
      <HuemulDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        title={selectedImage?.name || t('customFields.table.imagePreview')}
        maxWidth="sm:max-w-2xl"
        maxHeight="max-h-[90vh]"
        showFooter={false}
      >
        <div className="flex justify-center">
          {selectedImage && (
            <img
              src={selectedImage.url}
              alt={selectedImage.name}
              className="max-h-[70vh] w-auto object-contain rounded"
            />
          )}
        </div>
      </HuemulDialog>
    </>
  )
}