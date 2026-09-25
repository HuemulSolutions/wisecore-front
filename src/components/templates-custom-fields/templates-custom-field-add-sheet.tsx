import { AddCustomFieldSheet } from "@/components/custom-fields/add-custom-field-sheet"
import { useCustomFieldTemplateSources } from "@/hooks/useCustomFieldTemplates"
import { uploadCustomFieldTemplateValueBlob } from "@/services/custom-fields-templates"
import type { AddCustomFieldTemplateDialogProps } from '@/types/templates';
export type { AddCustomFieldTemplateDialogProps } from '@/types/templates';

export function AddCustomFieldTemplateSheet({
  isOpen,
  onClose,
  templateId,
  onAdd,
  canCreateCustomField,
}: AddCustomFieldTemplateDialogProps) {
  // Fetch custom field template sources
  const {
    data: sources = [],
    isLoading: isLoadingSources,
  } = useCustomFieldTemplateSources()

  return (
    <AddCustomFieldSheet
      isOpen={isOpen}
      onClose={onClose}
      entityId={templateId}
      entityType="template"
      onAdd={onAdd}
      uploadImageFn={uploadCustomFieldTemplateValueBlob}
      sources={sources}
      isLoadingSources={isLoadingSources}
      // `custom_fields:c` resuelto por /templates y propagado por el tab
      // (templates.tsx → templates-content.tsx → TemplateCustomFields).
      canCreateCustomField={canCreateCustomField}
    />
  )
}
