"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { useCustomFieldTemplatesByTemplate, useCustomFieldTemplateMutations } from "@/hooks/useCustomFieldTemplates"
import { CustomFieldTemplateTable } from "./templates-custom-field-table"
import { CustomFieldTemplateEmptyState } from "./templates-custom-field-empty-state"
import { AddCustomFieldTemplateDialog } from "./templates-custom-field-add-dialog"
import { EditCustomFieldTemplateDialog } from "./templates-edit-custom-field-dialog"
import type { CustomFieldTemplate } from "@/types/custom-fields-templates"

interface TemplateCustomFieldsProps {
  templateId: string
}

export function TemplateCustomFields({ templateId }: TemplateCustomFieldsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCustomFieldTemplate, setSelectedCustomFieldTemplate] = useState<CustomFieldTemplate | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const {
    data: customFieldTemplates = [],
    isLoading: isLoadingCustomFieldTemplates,
    error,
    refetch
  } = useCustomFieldTemplatesByTemplate(templateId, {
    enabled: !!templateId,
    page,
    page_size: pageSize,
  })

  const mutations = useCustomFieldTemplateMutations()

  const handleAddCustomFieldTemplate = () => {
    setIsAddDialogOpen(true)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      // Add a small delay to ensure the animation is visible
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    }
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
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Custom Fields</h2>
            <p className="text-xs text-muted-foreground">
              Manage custom fields for this template
            </p>
          </div>
          <Button
            disabled
            size="sm"
            className="hover:cursor-pointer h-8 text-xs px-3"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Field
          </Button>
        </div>
        
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Custom Fields</h2>
            <p className="text-xs text-muted-foreground">
              Manage custom fields for this template
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            size="sm"
            variant="outline"
            className="hover:cursor-pointer h-8 text-xs px-3"
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
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Custom Fields</h2>
          <p className="text-xs text-muted-foreground">
            Manage custom fields for this template
          </p>
        </div>
        
        {hasCustomFieldTemplates && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              size="sm"
              variant="outline"
              className="hover:cursor-pointer h-8 text-xs px-3"
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleAddCustomFieldTemplate}
              size="sm"
              className="hover:cursor-pointer h-8 text-xs px-3"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Field
            </Button>
          </div>
        )}
      </div>

      {hasCustomFieldTemplates ? (
        <CustomFieldTemplateTable
          customFieldTemplates={customFieldTemplates}
          onEditCustomFieldTemplate={handleEditCustomFieldTemplate}
          onDeleteCustomFieldTemplate={handleDeleteCustomFieldTemplate}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize)
            setPage(1)
          }}
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