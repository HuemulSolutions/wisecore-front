import { AddCustomFieldDialog } from "@/components/custom-fields/add-custom-field-dialog"
import { useCustomFieldTemplateSources } from "@/hooks/useCustomFieldTemplates"
import { uploadCustomFieldTemplateValueBlob } from "@/services/custom-fields-templates"

interface AddCustomFieldTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  templateId: string
  onAdd: (data: any) => Promise<any>
}

export function AddCustomFieldTemplateDialog({
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
    <AddCustomFieldDialog
      isOpen={isOpen}
      onClose={onClose}
      entityId={templateId}
      entityType="template"
      onAdd={onAdd}
      uploadImageFn={uploadCustomFieldTemplateValueBlob}
      sources={sources}
      isLoadingSources={isLoadingSources}
    />
  )
}