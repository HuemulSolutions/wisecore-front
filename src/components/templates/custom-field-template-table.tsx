"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Edit2, Trash2, Loader2 } from "lucide-react"
import type { CustomFieldTemplate } from "@/types/custom-fields-templates"

interface CustomFieldTemplateTableProps {
  customFieldTemplates: CustomFieldTemplate[]
  onEditCustomFieldTemplate: (customFieldTemplate: CustomFieldTemplate) => void
  onDeleteCustomFieldTemplate: (customFieldTemplate: CustomFieldTemplate) => void
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
        {/* <span className="text-xs text-muted-foreground">
          {hasValue ? (template.value_bool ? "True" : "False") : "No value set"}
        </span> */}
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
            className="w-8 h-8 object-cover rounded border border-gray-200"
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

export function CustomFieldTemplateTable({
  customFieldTemplates,
  onEditCustomFieldTemplate,
  onDeleteCustomFieldTemplate,
}: CustomFieldTemplateTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customFieldToDelete, setCustomFieldToDelete] = useState<CustomFieldTemplate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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
          // Assume success since the parent handles the actual mutation
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
    return null // This should not be rendered when empty, parent handles empty state
  }

  return (
    <>
    <Card className="border border-border bg-card overflow-auto">
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted z-10">
            <tr className="border-b border-border">
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Field Name
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Type
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Values
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Required
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Prompt
              </th>
              <th className="px-2 py-1.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {customFieldTemplates.map((template) => (
              <tr key={template.id} className="border-b border-border hover:bg-muted/20 transition">
                <td className="px-2 py-1.5">
                  <div className="text-xs font-medium text-foreground">
                    {template.name} {/* This should be the custom field name, might need to join data */}
                  </div>
                </td>
                <td className="px-2 py-1.5">
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {formatDataType(template.data_type)}
                  </Badge>
                </td>
                <td className="px-2 py-1.5">
                  {renderValueDisplay(template)}
                </td>
                <td className="px-2 py-1.5">
                  <Switch 
                    checked={template.required} 
                    disabled
                    className="data-[state=checked]:bg-primary scale-75"
                  />
                </td>
                <td className="px-2 py-1.5">
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
                </td>
                <td className="px-2 py-1.5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="hover:cursor-pointer h-5 w-5 p-0"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => {
                          onEditCustomFieldTemplate(template)
                        }, 0)
                      }} className="hover:cursor-pointer">
                        <Edit2 className="mr-2 h-3 w-3" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => {
                          handleDeleteClick(template)
                        }, 0)
                      }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      {customFieldTemplates.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/20 text-xs text-muted-foreground border-t">
          <span>
            {customFieldTemplates.length} field{customFieldTemplates.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-3">
            <span>
              {customFieldTemplates.filter(t => t.required).length} required
            </span>
          </div>
        </div>
      )}
    </Card>

    {/* Delete confirmation dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
      if (!open && !isDeleting) {
        setDeleteDialogOpen(false)
        setCustomFieldToDelete(null)
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Custom Field Template</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the custom field template "{customFieldToDelete?.name}"? 
            This action cannot be undone and will remove this field from the template.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelDelete} className="hover:cursor-pointer" disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirmDelete()
            }}
            className="bg-destructive hover:bg-destructive/90 hover:cursor-pointer"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}