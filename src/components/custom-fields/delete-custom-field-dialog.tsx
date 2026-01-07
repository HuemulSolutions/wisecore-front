"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
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
          // Call onConfirm which should handle the actual mutation
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
      // Close the dialog after successful deletion
      onOpenChange(false)
    }
  }

  if (!customField) return null

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          onOpenChange(open)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
          <AlertDialogDescription asChild>
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="hover:cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
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
              "Delete Custom Field"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}