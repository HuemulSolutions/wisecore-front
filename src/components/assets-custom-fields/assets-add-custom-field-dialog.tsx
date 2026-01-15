import { AddCustomFieldDialog } from "@/components/custom-fields/add-custom-field-dialog"
import { getCustomFieldDocumentSources, uploadCustomFieldDocumentValueBlob } from "@/services/custom-fieldds-documents"
import { useQuery } from "@tanstack/react-query"

interface AddCustomFieldDocumentDialogProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  onAdd: (data: any) => Promise<any>
  onImageUploadStart?: (fieldId: string) => void
  onImageUploadComplete?: () => void
}

export function AddCustomFieldDocumentDialog({
  isOpen,
  onClose,
  documentId,
  onAdd,
  onImageUploadStart,
  onImageUploadComplete,
}: AddCustomFieldDocumentDialogProps) {
  // Fetch custom field document sources (lazy loading: only when dialog is open)
  const { data: sources = [], isLoading: isLoadingSources } = useQuery({
    queryKey: ['custom-field-document-sources'],
    queryFn: async () => {
      const response = await getCustomFieldDocumentSources();
      return response.data;
    },
    enabled: isOpen, // Only fetch when dialog is actually open
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes - sources don't change often
  });

  return (
    <AddCustomFieldDialog
      isOpen={isOpen}
      onClose={onClose}
      entityId={documentId}
      entityType="document"
      onAdd={onAdd}
      uploadImageFn={uploadCustomFieldDocumentValueBlob}
      sources={sources}
      isLoadingSources={isLoadingSources}
      onImageUploadStart={onImageUploadStart}
      onImageUploadComplete={onImageUploadComplete}
    />
  )
}