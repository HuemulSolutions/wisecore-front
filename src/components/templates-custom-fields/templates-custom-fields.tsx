"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { useCustomFieldTemplatesByTemplate, useCustomFieldTemplateMutations } from "@/hooks/useCustomFieldTemplates"
import { useTableLoadingState } from "@/hooks/useTableLoadingState"
import { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS } from "@/huemul/constants"
import { CustomFieldTemplateTable } from "./templates-custom-field-table"
import { CustomFieldTemplateEmptyState } from "./templates-custom-field-empty-state"
import { AddCustomFieldTemplateSheet } from "./templates-custom-field-add-sheet"
import { EditCustomFieldTemplateSheet } from "./templates-edit-custom-field-sheet"
import type { CustomFieldTemplate } from '@/types/custom-fields'
import { logger } from "@/lib/logger"
import type { TemplateCustomFieldsProps } from '@/types/templates';
export type { TemplateCustomFieldsProps } from '@/types/templates';

export function TemplateCustomFields({ templateId, canCreate = false, canUpdate = false, canDelete = false }: TemplateCustomFieldsProps) {
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

  if (showPageLoader) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{t('templates:customFields.title')}</h2>
            <p className="text-xs text-muted-foreground">
              {t('templates:customFields.description')}
            </p>
          </div>
          {canCreate && (
            <Button
              disabled
              size="sm"
              className="hover:cursor-pointer h-8 text-xs px-3"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t('templates:customFields.addField')}
            </Button>
          )}
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
            <h2 className="text-base font-semibold text-foreground">{t('templates:customFields.title')}</h2>
            <p className="text-xs text-muted-foreground">
              {t('templates:customFields.description')}
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            size="sm"
            variant="outline"
            className="hover:cursor-pointer h-8 text-xs px-3"
          >
            {t('common:retry')}
          </Button>
        </div>
        
        <div className="text-center py-8">
          <p className="text-sm text-destructive">
            {t('templates:customFields.loadError')}
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
          <h2 className="text-base font-semibold text-foreground">{t('templates:customFields.title')}</h2>
          <p className="text-xs text-muted-foreground">
            {t('templates:customFields.description')}
          </p>
        </div>
        
        {hasCustomFieldTemplates && (
          <div className="flex items-center gap-2">
            <HuemulButton
              icon={RefreshCw}
              iconClassName="mr-1.5 h-3.5 w-3.5"
              label={t('common:refresh')}
              size="sm"
              variant="outline"
              className="h-8 text-xs px-3"
              loading={isTableFetching}
              onClick={handleRefresh}
            />
            {canCreate && (
              <Button
                onClick={handleAddCustomFieldTemplate}
                size="sm"
                className="hover:cursor-pointer h-8 text-xs px-3"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t('templates:customFields.addField')}
              </Button>
            )}
          </div>
        )}
      </div>

      {hasCustomFieldTemplates ? (
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
        <CustomFieldTemplateEmptyState
          onAddCustomFieldTemplate={handleAddCustomFieldTemplate}
          canCreate={canCreate}
        />
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