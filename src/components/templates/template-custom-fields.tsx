"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useCustomFieldTemplatesByTemplate, useCustomFieldTemplateMutations } from "@/hooks/useCustomFieldTemplates"
import { CustomFieldTemplateTable } from "./custom-field-template-table"
import { CustomFieldTemplateEmptyState } from "./custom-field-template-empty-state"
import { AddCustomFieldTemplateDialog } from "./add-custom-field-template-dialog"
import { EditCustomFieldTemplateDialog } from "./edit-custom-field-template-dialog"
import type { CustomFieldTemplate } from "@/types/custom-fields-templates"

interface TemplateCustomFieldsProps {
  templateId: string
}

export function TemplateCustomFields({ templateId }: TemplateCustomFieldsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCustomFieldTemplate, setSelectedCustomFieldTemplate] = useState<CustomFieldTemplate | null>(null)

  const {
    data: customFieldTemplates = [],
    isLoading: isLoadingCustomFieldTemplates,
    error,
    refetch
  } = useCustomFieldTemplatesByTemplate(templateId, {
    enabled: !!templateId,
  })

  const mutations = useCustomFieldTemplateMutations()

  const handleAddCustomFieldTemplate = () => {
    setIsAddDialogOpen(true)
  }

  const handleAddCustomFieldTemplateSubmit = async (data: any) => {
    try {
      const createdTemplate = await mutations.create.mutateAsync(data)
      setIsAddDialogOpen(false)
      refetch()
      return createdTemplate // Return the created template so the dialog can use it
    } catch (error) {
      console.error("Error creating custom field template:", error)
      throw error // Re-throw so the dialog can handle it
    }
  }

  const handleEditCustomFieldTemplate = (customFieldTemplate: CustomFieldTemplate) => {
    setSelectedCustomFieldTemplate(customFieldTemplate)
    setIsEditDialogOpen(true)
  }

  const handleEditCustomFieldTemplateSubmit = (id: string, data: any) => {
    mutations.update.mutate({ id, data }, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
        setSelectedCustomFieldTemplate(null)
        refetch()
      },
    })
  }

  const handleDeleteCustomFieldTemplate = (customFieldTemplate: CustomFieldTemplate) => {
    mutations.delete.mutate(customFieldTemplate.id, {
      onSuccess: () => {
        refetch()
      },
    })
  }

  if (isLoadingCustomFieldTemplates) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Custom Fields</h2>
            <p className="text-sm text-muted-foreground">
              Manage custom fields for this template
            </p>
          </div>
          <Button
            disabled
            size="sm"
            className="hover:cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Field
          </Button>
        </div>
        
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Custom Fields</h2>
            <p className="text-sm text-muted-foreground">
              Manage custom fields for this template
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            size="sm"
            variant="outline"
            className="hover:cursor-pointer"
          >
            Retry
          </Button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-sm text-destructive">
            Error loading custom fields. Please try again.
          </p>
        </div>
      </div>
    )
  }

  const hasCustomFieldTemplates = customFieldTemplates.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Custom Fields</h2>
          <p className="text-sm text-muted-foreground">
            Manage custom fields for this template
          </p>
        </div>
        
        {hasCustomFieldTemplates && (
          <Button
            onClick={handleAddCustomFieldTemplate}
            size="sm"
            className="hover:cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Custom Field
          </Button>
        )}
      </div>

      {hasCustomFieldTemplates ? (
        <CustomFieldTemplateTable
          customFieldTemplates={customFieldTemplates}
          onEditCustomFieldTemplate={handleEditCustomFieldTemplate}
          onDeleteCustomFieldTemplate={handleDeleteCustomFieldTemplate}
        />
      ) : (
        <CustomFieldTemplateEmptyState
          onAddCustomFieldTemplate={handleAddCustomFieldTemplate}
        />
      )}

      {/* Add Custom Field Template Dialog */}
      <AddCustomFieldTemplateDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        templateId={templateId}
        onAdd={handleAddCustomFieldTemplateSubmit}
      />

      {/* Edit Custom Field Template Dialog */}
      <EditCustomFieldTemplateDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setSelectedCustomFieldTemplate(null)
        }}
        customFieldTemplate={selectedCustomFieldTemplate}
        onUpdate={handleEditCustomFieldTemplateSubmit}
      />
    </div>
  )
}