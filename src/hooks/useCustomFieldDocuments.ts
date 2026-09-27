import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { getCustomFieldDocumentsByDocument } from "@/services/custom-fieldds-documents"
import { getMissingRequiredCustomFields } from "@/lib/custom-field-required-utils"

/**
 * Tamaño de página del listado de custom fields de un documento. Compartido
 * entre el tab lateral de assets-content y la validación preventiva del
 * lifecycle para que ambos peguen a la MISMA query key (cache compartido, un
 * solo fetch).
 */
export const CUSTOM_FIELD_DOCUMENTS_PAGE_SIZE = 100

export const customFieldDocumentsQueryKeys = {
  all: ["custom-field-documents"] as const,
  byDocument: (documentId: string | null | undefined, page: number, pageSize: number) =>
    [...customFieldDocumentsQueryKeys.all, documentId, page, pageSize] as const,
}

/**
 * Custom fields obligatorios del documento que todavía no tienen valor.
 * Alimenta el aviso preventivo del diálogo de completar y la lista del
 * diálogo de error CUSTOM_FIELD_DOCUMENT_REQUIRED_VALUE_MISSING.
 */
export function useMissingRequiredCustomFields({
  documentId,
  organizationId,
  enabled = true,
}: {
  documentId: string | null | undefined
  organizationId: string | null | undefined
  enabled?: boolean
}) {
  const query = useQuery({
    queryKey: customFieldDocumentsQueryKeys.byDocument(documentId, 1, CUSTOM_FIELD_DOCUMENTS_PAGE_SIZE),
    queryFn: () =>
      getCustomFieldDocumentsByDocument({
        document_id: documentId!,
        page: 1,
        page_size: CUSTOM_FIELD_DOCUMENTS_PAGE_SIZE,
      }),
    enabled: enabled && !!documentId && !!organizationId,
    staleTime: 60000, // igual que la query del tab: si ya la trajo, no refetchea
  })

  const missingFields = useMemo(() => getMissingRequiredCustomFields(query.data?.data), [query.data])

  return {
    missingFields,
    missingFieldNames: missingFields.map((f) => f.name),
    isLoading: query.isLoading,
    /** true si el documento tiene más de una página de custom fields: la lista local puede estar incompleta. */
    hasMorePages: !!query.data?.has_next,
  }
}
