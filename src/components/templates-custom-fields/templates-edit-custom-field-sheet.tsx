"use client"

import { useCustomFieldTemplateSources } from "@/hooks/useCustomFieldTemplates"
import { uploadCustomFieldTemplateValueBlob } from "@/services/custom-fields-templates"
import { CustomFieldValueSheet } from "@/components/custom-fields/custom-field-value-sheet"
import type { EditCustomFieldTemplateDialogProps } from '@/types/templates';
export type { EditCustomFieldTemplateDialogProps } from '@/types/templates';

export function EditCustomFieldTemplateSheet({
  isOpen,
  onClose,
  customFieldTemplate,
  onUpdate,
  mode = "configuration",
}: EditCustomFieldTemplateDialogProps) {
  const { data: sources = [], isLoading: isLoadingSources } = useCustomFieldTemplateSources()

  return (
    <CustomFieldValueSheet
      isOpen={isOpen}
      onClose={onClose}
      entity={customFieldTemplate}
      entityType="template"
      mode={mode}
      sources={sources}
      isLoadingSources={isLoadingSources}
      uploadImageFn={uploadCustomFieldTemplateValueBlob}
      onUpdate={onUpdate}
    />
  )
}
