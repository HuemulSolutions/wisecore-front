import { AddCustomFieldDialog } from "@/components/custom-fields/add-custom-field-dialog"
import { getCustomFieldDocumentSources, uploadCustomFieldDocumentValueBlob } from "@/services/custom-fieldds-documents"
import { useQuery } from "@tanstack/react-query"

interface AddCustomFieldDocumentDialogProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  onAdd: (data: any) => Promise<any>
}

export function AddCustomFieldDocumentDialog({
  isOpen,
  onClose,
  documentId,
  onAdd,
}: AddCustomFieldDocumentDialogProps) {
  // Fetch custom field document sources
  const { data: sources = [], isLoading: isLoadingSources } = useQuery({
    queryKey: ['custom-field-document-sources'],
    queryFn: async () => {
      const response = await getCustomFieldDocumentSources();
      return response.data;
    }
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
    />
  )
}