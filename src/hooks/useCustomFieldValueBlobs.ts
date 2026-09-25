import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getCustomFieldValueBlobs,
  addCustomFieldValueBlob,
  deleteCustomFieldValueBlob,
} from "@/services/custom-field-value-blobs"
import type { CustomFieldValueEntityType } from "@/types/custom-fields"
import { useOrganization } from "@/contexts/organization-context"
import { customFieldDocumentsQueryKeys } from "@/hooks/useCustomFieldDocuments"
import { customFieldTemplatesQueryKeys } from "@/hooks/useCustomFieldTemplates"

export const customFieldValueBlobsQueryKeys = {
  all: ['custom-field-value-blobs'] as const,
  list: (entityType: CustomFieldValueEntityType, entityCustomFieldId: string) =>
    [...customFieldValueBlobsQueryKeys.all, entityType, entityCustomFieldId] as const,
}

// Fila (entity) padre invalidada tras cada mutación — value_files viaja en el detalle
// del custom field value, así que la tabla/sheet que lista custom fields del
// asset/template también debe refrescar.
function parentQueryKeys(entityType: CustomFieldValueEntityType) {
  return entityType === "template" ? customFieldTemplatesQueryKeys.all : customFieldDocumentsQueryKeys.all
}

export function useCustomFieldValueBlobs(
  entityType: CustomFieldValueEntityType,
  entityCustomFieldId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: customFieldValueBlobsQueryKeys.list(entityType, entityCustomFieldId),
    queryFn: () => getCustomFieldValueBlobs(entityType, entityCustomFieldId),
    enabled: enabled && !!entityCustomFieldId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

export function useCustomFieldValueBlobMutations(
  entityType: CustomFieldValueEntityType,
  entityCustomFieldId: string,
) {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: customFieldValueBlobsQueryKeys.list(entityType, entityCustomFieldId) })
    queryClient.invalidateQueries({ queryKey: parentQueryKeys(entityType) })
  }

  const addBlob = useMutation({
    mutationFn: (file: File) => addCustomFieldValueBlob(entityType, entityCustomFieldId, file, selectedOrganizationId!),
    onSuccess: invalidate,
  })

  const deleteBlob = useMutation({
    mutationFn: (blobId: string) => deleteCustomFieldValueBlob(entityType, entityCustomFieldId, blobId),
    onSuccess: invalidate,
  })

  return { addBlob, deleteBlob }
}
