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
      // TODO(rbac-audit): templates-custom-fields.tsx no cruza custom_fields:c
      // para este flujo (grep de canManage|hasPermission|isOrgAdmin|isRootAdmin
      // en ese archivo da 0 resultados). Se fija true explícito para no
      // romper el flujo existente con el default seguro (false) de
      // AddCustomFieldSheet.
      canCreateCustomField={true}
    />
  )
}
