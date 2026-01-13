"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Edit2, Trash2, FileText } from "lucide-react"
import type { CustomField } from "@/types/custom-fields"
import type { useCustomFieldMutations } from "@/hooks/useCustomFields"

interface CustomFieldTableProps {
  customFields: CustomField[]
  selectedCustomFields: Set<string>
  onCustomFieldSelection: (customFieldId: string) => void
  onSelectAll: () => void
  onEditCustomField: (customField: CustomField) => void
  onDeleteCustomField: (customField: CustomField) => void
  customFieldMutations: ReturnType<typeof useCustomFieldMutations>
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
}: CustomFieldTableProps) {
  const [actionsLoading] = useState<Set<string>>(new Set())

  const isAllSelected = customFields.length > 0 && selectedCustomFields.size === customFields.length
  const isIndeterminate = selectedCustomFields.size > 0 && selectedCustomFields.size < customFields.length

  if (customFields.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No custom fields found</h3>
          <p className="text-muted-foreground">
            No custom fields have been created yet or match your search criteria.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="border border-border bg-card overflow-auto max-h-[75vh]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-muted z-10">
            <tr className="border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground w-8">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Select all custom fields"
                  {...(isIndeterminate && { "data-indeterminate": true })}
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Name</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Description</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Data Type</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Mask</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-foreground">Created</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customFields.map((customField) => (
              <tr key={customField.id} className="border-b border-border hover:bg-muted/20 transition">
                <td className="px-3 py-2">
                  <Checkbox
                    checked={selectedCustomFields.has(customField.id)}
                    onCheckedChange={() => onCustomFieldSelection(customField.id)}
                    aria-label={`Select custom field ${customField.name}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">{customField.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ID: {customField.id}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="max-w-xs truncate text-xs text-foreground" title={customField.description}>
                    {customField.description || "No description"}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    {formatDataType(customField.data_type)}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded border">
                    {customField.masc || "None"}
                  </code>
                </td>
                <td className="px-3 py-2 text-xs text-foreground">
                  {formatDate(customField.created_at)}
                </td>
                <td className="px-3 py-2 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="hover:cursor-pointer h-6 w-6 p-0"
                        disabled={actionsLoading.has(customField.id)}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => {
                          onEditCustomField(customField)
                        }, 0)
                      }} className="hover:cursor-pointer">
                        <Edit2 className="mr-2 h-3 w-3" />
                        Edit Custom Field
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => {
                        setTimeout(() => {
                          onDeleteCustomField(customField)
                        }, 0)
                      }} className="hover:cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-3 w-3" />
                        Delete Custom Field
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
      {customFields.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 sm:px-4 py-2 sm:py-3 bg-muted/20 text-xs text-muted-foreground border-t gap-1 sm:gap-0">
          <span className="text-xs">
            Showing {customFields.length} custom field{customFields.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs">
              {selectedCustomFields.size} selected
            </span>
          </div>
        </div>
      )}
    </Card>
  )
}