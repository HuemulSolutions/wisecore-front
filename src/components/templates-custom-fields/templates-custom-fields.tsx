"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Plus, FileSliders } from "lucide-react"
import { useCustomFieldTemplatesByTemplate, useCustomFieldTemplateMutations } from "@/hooks/useCustomFieldTemplates"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { TemplateSettingsPanelHeader } from "@/components/templates/templates-settings-panel-header"
import { CustomFieldTemplateTable } from "./templates-custom-field-table"
import { CustomFieldTemplateEmptyState } from "./templates-custom-field-empty-state"
import { AddCustomFieldTemplateSheet } from "./templates-custom-field-add-sheet"
import { EditCustomFieldTemplateSheet } from "./templates-edit-custom-field-sheet"
import type { CustomFieldTemplate } from '@/types/custom-fields'
import { logger } from "@/lib/logger"
import type { TemplateCustomFieldsProps } from '@/types/templates';
export type { TemplateCustomFieldsProps } from '@/types/templates';

export function TemplateCustomFields({ templateId, canCreate = false, canUpdate = false, canDelete = false, onBack }: TemplateCustomFieldsProps) {
  const { t } = useTranslation(['templates', 'common'])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCustomFieldTemplate, setSelectedCustomFieldTemplate] = useState<CustomFieldTemplate | null>(null)
  const [customFieldEditMode, setCustomFieldEditMode] = useState<"content" | "configuration">("configuration")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const {
    data: customFieldTemplatesResponse,
    isLoading: isLoadingCustomFieldTemplates,
    isFetching: isFetchingCustomFieldTemplates,
    error,
    refetch
  } = useCustomFieldTemplatesByTemplate(templateId, {
    enabled: !!templateId,
    page,
    page_size: pageSize,
  })

  const customFieldTemplates = customFieldTemplatesResponse?.data || []

  const { showPageLoader, isTableLoading, isTableFetching } = useTableLoadingState({
    isLoading: isLoadingCustomFieldTemplates,
    isFetching: isFetchingCustomFieldTemplates,
    hasData: !!customFieldTemplatesResponse,
  })

  const mutations = useCustomFieldTemplateMutations()

  const handleAddCustomFieldTemplate = () => {
    setIsAddDialogOpen(true)
  }

  const handleRefresh = () => {
    refetch()
  }

  const handleAddCustomFieldTemplateSubmit = async (data: any) => {
    try {
      const createdTemplate = await mutations.create.mutateAsync(data)
      setIsAddDialogOpen(false)
      refetch()
      return createdTemplate // Return the created template so the dialog can use it
    } catch (error) {
      logger.error("Error creating custom field template:", error)
      throw error // Re-throw so the dialog can handle it
    }
  }

  const handleEditCustomFieldTemplate = (customFieldTemplate: CustomFieldTemplate) => {
    setSelectedCustomFieldTemplate(customFieldTemplate)
    setCustomFieldEditMode("configuration")
    setIsEditDialogOpen(true)
  }

  const handleEditCustomFieldTemplateContent = (customFieldTemplate: CustomFieldTemplate) => {
    setSelectedCustomFieldTemplate(customFieldTemplate)
    setCustomFieldEditMode("content")
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

  const hasCustomFieldTemplates = customFieldTemplates.length > 0

  return (
    <div className="px-4 py-6">
      <TemplateSettingsPanelHeader
        className="mb-6"
        onBack={onBack}
        icon={FileSliders}
        title={t('templates:customFields.title')}
        subtitle={t('templates:customFields.description')}
        refresh={{ onClick: handleRefresh, loading: isTableFetching }}
        primaryAction={canCreate ? { icon: Plus, label: t('templates:customFields.addField'), onClick: handleAddCustomFieldTemplate } : undefined}
      />

      {showPageLoader ? (
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-destructive">
            {t('templates:customFields.loadError')}
          </p>
        </div>
      ) : hasCustomFieldTemplates ? (
        <CustomFieldTemplateTable
          customFieldTemplates={customFieldTemplates}
          onEditCustomFieldTemplate={handleEditCustomFieldTemplate}
          onEditContentCustomFieldTemplate={handleEditCustomFieldTemplateContent}
          onDeleteCustomFieldTemplate={handleDeleteCustomFieldTemplate}
          isLoading={isTableLoading}
          isFetching={isTableFetching}
          canUpdate={canUpdate}
          canDelete={canDelete}
          pagination={{
            page: customFieldTemplatesResponse?.page || page,
            pageSize: customFieldTemplatesResponse?.page_size || pageSize,
            hasNext: customFieldTemplatesResponse?.has_next,
            hasPrevious: (customFieldTemplatesResponse?.page || page) > 1,
            onPageChange: (newPage: number) => setPage(newPage),
            onPageSizeChange: (newPageSize: number) => {
              setPageSize(newPageSize)
              setPage(1)
            },
            pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS
          }}
        />
      ) : (
        <CustomFieldTemplateEmptyState canCreate={canCreate} />
      )}

      {/* Add Custom Field Template Sheet */}
      <AddCustomFieldTemplateSheet
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        templateId={templateId}
        onAdd={handleAddCustomFieldTemplateSubmit}
        canCreateCustomField={canCreate}
      />

      {/* Edit Custom Field Template Sheet */}
      <EditCustomFieldTemplateSheet
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setSelectedCustomFieldTemplate(null)
        }}
        customFieldTemplate={selectedCustomFieldTemplate}
        onUpdate={handleEditCustomFieldTemplateSubmit}
        mode={customFieldEditMode}
      />
    </div>
  )
}