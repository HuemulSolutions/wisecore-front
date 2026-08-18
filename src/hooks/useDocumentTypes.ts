import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getDocumentTypes, createDocumentType, deleteDocumentType } from "@/services/document-types"

// Query keys
export const documentTypeQueryKeys = {
  all: ['document-types'] as const,
  lists: () => [...documentTypeQueryKeys.all, 'list'] as const,
  list: (params?: { search?: string; tag_id?: string }) => [...documentTypeQueryKeys.lists(), params] as const,
}

// Hook for fetching document types
export function useDocumentTypes(options?: { search?: string; tag_id?: string; enabled?: boolean }) {
  const { search, tag_id, enabled = true } = options ?? {}
  return useQuery({
    queryKey: documentTypeQueryKeys.list({ search, tag_id }),
    queryFn: () => getDocumentTypes({ search, tag_id }),
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
      queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.lists() })
    },
  })

  const deleteDocumentTypeMutation = useMutation({
    mutationFn: deleteDocumentType,
    meta: { successMessage: 'Asset type deleted successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.lists() })
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => deleteDocumentType(id)))
    },
    meta: { successMessage: 'Asset types deleted successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.lists() })
    },
  })

  return {
    createDocumentType: createDocumentTypeMutation,
    deleteDocumentType: deleteDocumentTypeMutation,
    bulkDeleteDocumentTypes: bulkDeleteMutation,
  }
}