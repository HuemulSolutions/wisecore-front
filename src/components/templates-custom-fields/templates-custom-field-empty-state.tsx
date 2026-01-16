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
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          No custom fields
        </h3>
        
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          This template doesn't have any custom fields yet. Add your first custom field to get started.
        </p>
        
        <Button
          onClick={onAddCustomFieldTemplate}
          className="mt-6 hover:cursor-pointer"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Custom Field
        </Button>
      </div>
    </Card>
  )
}