"use client"

import { useState } from "react"
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import { Badge } from "@/components/ui/badge"
import type { CustomField } from "@/types/custom-fields"

interface DeleteCustomFieldDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customField: CustomField | null
  onConfirm: (customField: CustomField) => void
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

export function DeleteCustomFieldDialog({
  open,
  onOpenChange,
  customField,
  onConfirm,
}: DeleteCustomFieldDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!customField) return

    setIsDeleting(true)
    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          try {
            onConfirm(customField)
            resolve()
          } catch (error) {
            reject(error)
          }
        }),
        minDelay
      ])
    } finally {
      setIsDeleting(false)
      onOpenChange(false)
    }
  }

  if (!customField) return null

  return (
    <ReusableAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Custom Field"
      description={
        <div className="space-y-3">
          <p>
            Are you sure you want to delete this custom field? This action cannot be undone.
          </p>
          
          <div className="rounded-lg border p-3 bg-muted/50">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {customField.name}
              </div>
              <div>
                <span className="font-medium">Description:</span> {customField.description}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Data Type:</span>
                <Badge variant="outline">
                  {formatDataType(customField.data_type)}
                </Badge>
              </div>
              {customField.masc && (
                <div>
                  <span className="font-medium">Mask:</span>
                  <code className="ml-1 text-xs bg-background px-1 py-0.5 rounded">
                    {customField.masc}
                  </code>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            <strong>Warning:</strong> Deleting this custom field will remove it from all documents
            that currently use it. Any data stored in this field will be lost permanently.
          </p>
        </div>
      }
      onConfirm={handleDelete}
      confirmLabel="Delete Custom Field"
      isProcessing={isDeleting}
    />
  )
}