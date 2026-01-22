"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, FileText } from "lucide-react"

interface CustomFieldTemplateEmptyStateProps {
  onAddCustomFieldTemplate: () => void
}

export function CustomFieldTemplateEmptyState({
  onAddCustomFieldTemplate,
}: CustomFieldTemplateEmptyStateProps) {
  return (
    <Card className="border border-dashed border-border/50 bg-card">
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        
        <h3 className="mt-5 text-lg font-semibold text-foreground">
          No custom fields
        </h3>
        
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          This template doesn't have any custom fields yet. Add your first custom field to get started.
        </p>
        
        <Button
          onClick={onAddCustomFieldTemplate}
          className="mt-7 hover:cursor-pointer h-9 px-4"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Field
        </Button>
      </div>
    </Card>
  )
}