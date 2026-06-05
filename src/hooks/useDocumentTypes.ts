import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getDocumentTypes, createDocumentType, deleteDocumentType } from "@/services/document-types"

// Query keys
export const documentTypeQueryKeys = {
  all: ['document-types'] as const,
  list: (search?: string) => [...documentTypeQueryKeys.all, 'list', search ?? ''] as const,
}

// Hook for fetching document types
export function useDocumentTypes(options?: { search?: string; enabled?: boolean }) {
  const { search, enabled = true } = options ?? {}
  return useQuery({
    queryKey: documentTypeQueryKeys.list(search),
    queryFn: () => getDocumentTypes({ search }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 0,
    placeholderData: (prev) => prev,
    enabled,
  })
}

// Hook for document type mutations
export function useDocumentTypeMutations() {
  const queryClient = useQueryClient()

  const createDocumentTypeMutation = useMutation({
    mutationFn: createDocumentType,
    meta: { successMessage: 'Asset type created successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.list() })
    },
  })

  const deleteDocumentTypeMutation = useMutation({
    mutationFn: deleteDocumentType,
    meta: { successMessage: 'Asset type deleted successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.list() })
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => deleteDocumentType(id)))
    },
    meta: { successMessage: 'Asset types deleted successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.list() })
    },
  })

  return {
    createDocumentType: createDocumentTypeMutation,
    deleteDocumentType: deleteDocumentTypeMutation,
    bulkDeleteDocumentTypes: bulkDeleteMutation,
  }
}