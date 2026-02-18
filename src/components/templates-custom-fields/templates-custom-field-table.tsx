"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DataTable, type TableColumn, type TableAction } from "@/components/ui/data-table"
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Edit2, Trash2 } from "lucide-react"
import type { CustomFieldTemplate } from "@/types/custom-fields-templates"

interface PaginationConfig {
  page: number
  pageSize: number
  hasNext?: boolean
  hasPrevious?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

interface CustomFieldTemplateTableProps {
  customFieldTemplates: CustomFieldTemplate[]
  onEditCustomFieldTemplate: (customFieldTemplate: CustomFieldTemplate) => void
  onDeleteCustomFieldTemplate: (customFieldTemplate: CustomFieldTemplate) => void
  pagination?: PaginationConfig
}

const formatDataType = (dataType: string) => {
  switch (dataType) {
    case "string":
      return "STRING"
    case "int":
      return "INTEGER"
    case "decimal":
      return "DECIMAL"
    case "date":
      return "DATE"
    case "time":
      return "TIME"
    case "datetime":
      return "DATETIME"
    case "bool":
      return "BOOLEAN"
    case "image":
      return "IMAGE"
    case "url":
      return "URL"
    default:
      return dataType.toUpperCase()
  }
}

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
    default:
      return template.value_string || ""
  }
}

export function CustomFieldTemplateTable({
  customFieldTemplates,
  onEditCustomFieldTemplate,
  onDeleteCustomFieldTemplate,
  pagination,
}: CustomFieldTemplateTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customFieldToDelete, setCustomFieldToDelete] = useState<CustomFieldTemplate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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
              alt={template.name || 'Image'} 
              className="w-8 h-8 object-cover rounded border border-gray-200 hover:cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => {
                setSelectedImage({ url: imageUrl, name: template.name || 'Image' })
                setImageDialogOpen(true)
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <span className="text-xs text-gray-600 hidden">
              Error loading image
            </span>
          </div>
        )
      }
      return (
        <div className="text-xs text-muted-foreground">
          No image
        </div>
      )
    }
    
    const displayValue = getValueForDisplay(template)
    return (
      <div className="text-xs text-foreground max-w-xs truncate" title={displayValue}>
        {displayValue || "No value set"}
      </div>
    )
  }

  const handleDeleteClick = (customField: CustomFieldTemplate) => {
    setCustomFieldToDelete(customField)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!customFieldToDelete) return

    setIsDeleting(true)
    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    try {
      await Promise.all([
        new Promise<void>((resolve) => {
          onDeleteCustomFieldTemplate(customFieldToDelete)
          resolve()
        }),
        minDelay
      ])
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setCustomFieldToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setDeleteDialogOpen(false)
      setCustomFieldToDelete(null)
    }
  }

  if (customFieldTemplates.length === 0) {
    return null
  }

  // Define columns
  const columns: TableColumn<CustomFieldTemplate>[] = [
    {
      key: "name",
      label: "Field Name",
      render: (template) => (
        <div className="text-xs font-medium text-foreground">
          {template.name}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (template) => (
        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
          {formatDataType(template.data_type)}
        </Badge>
      ),
    },
    {
      key: "values",
      label: "Values",
      render: (template) => renderValueDisplay(template),
    },
    {
      key: "required",
      label: "Required",
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
      label: "Prompt",
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
      key: "edit",
      label: "Edit",
      icon: Edit2,
      onClick: onEditCustomFieldTemplate,
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      onClick: handleDeleteClick,
      destructive: true,
      separator: true,
    },
  ]

  // Define footer stats
  const footerStats = [
    {
      label: `${customFieldTemplates.length} field${customFieldTemplates.length !== 1 ? 's' : ''}`,
      value: "",
    },
    {
      label: "",
      value: `${customFieldTemplates.filter(t => t.required).length} required`,
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
          pageSizeOptions: pagination.pageSizeOptions || [10, 25, 50, 100, 250, 500, 1000]
        } : undefined}
        showFooterStats={false}
      />

      {/* Delete confirmation dialog */}
      <ReusableAlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            handleCancelDelete()
          }
        }}
        title="Delete Custom Field Template"
        description={`Are you sure you want to delete the custom field template "${customFieldToDelete?.name}"? This action cannot be undone and will remove this field from the template.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        isProcessing={isDeleting}
        variant="destructive"
      />

      {/* Image preview dialog */}
      <ReusableDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        title={selectedImage?.name || "Image Preview"}
        maxWidth="2xl"
        maxHeight="90vh"
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
      </ReusableDialog>
    </>
  )
}