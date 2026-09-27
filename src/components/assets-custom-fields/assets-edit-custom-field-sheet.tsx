"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustomFieldDocumentSources, uploadCustomFieldDocumentValueBlob } from "@/services/custom-fieldds-documents"
import { CustomFieldValueSheet } from "@/components/custom-fields/custom-field-value-sheet"
import type { EditCustomFieldAssetDialogProps } from '@/types/assets'
export type { EditCustomFieldAssetDialogProps } from '@/types/assets'

export function EditCustomFieldAssetSheet({
  isOpen,
  onClose,
  customFieldDocument,
  onUpdate,
  mode = "configuration",
}: EditCustomFieldAssetDialogProps) {
  const { data: sources = [], isLoading: isLoadingSources } = useQuery({
    queryKey: ['custom-field-document-sources'],
    queryFn: async () => {
      const response = await getCustomFieldDocumentSources();
      return response.data;
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <CustomFieldValueSheet
      isOpen={isOpen}
      onClose={onClose}
      entity={customFieldDocument}
      entityType="document"
      mode={mode}
      sources={sources}
      isLoadingSources={isLoadingSources}
      uploadImageFn={uploadCustomFieldDocumentValueBlob}
      onUpdate={onUpdate}
    />
  )
}
