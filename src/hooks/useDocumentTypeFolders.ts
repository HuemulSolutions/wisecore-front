import { useQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query"
import {
  getDocumentTypeFolders,
  createDocumentTypeFolder,
  updateDocumentTypeFolder,
  deleteDocumentTypeFolder,
  assignDocumentTypesToFolder,
  removeDocumentTypeFromFolder,
} from "@/services/document-type-folders"
import type {
  CreateDocumentTypeFolderData,
  UpdateDocumentTypeFolderData,
  AssignDocumentTypesToFolderData,
} from "@/types/document-type-folders"
import type { DocumentTypesResponse } from "@/types/document-types"
import { documentTypeQueryKeys } from "@/hooks/useDocumentTypes"

// Query keys
export const documentTypeFolderQueryKeys = {
  all: ['document-type-folders'] as const,
  listBase: () => [...documentTypeFolderQueryKeys.all, 'list'] as const,
  list: (params?: { page?: number; page_size?: number; search?: string }) =>
    [...documentTypeFolderQueryKeys.listBase(), params] as const,
  detail: (id: string) => [...documentTypeFolderQueryKeys.all, 'detail', id] as const,
}

// Hook for fetching document type folders
export function useDocumentTypeFolders(options?: {
  page?: number
  page_size?: number
  search?: string
  enabled?: boolean
}) {
  const { page, page_size, search, enabled = true } = options ?? {}
  return useQuery({
    queryKey: documentTypeFolderQueryKeys.list({ page, page_size, search }),
    queryFn: () => getDocumentTypeFolders({ page, page_size, search }),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
    placeholderData: (prev) => prev,
    enabled,
  })
}

// Hook for document type folder mutations
export function useDocumentTypeFolderMutations() {
  const queryClient = useQueryClient()

  const invalidateFolderAndTypeLists = () => {
    queryClient.invalidateQueries({ queryKey: documentTypeFolderQueryKeys.listBase() })
    queryClient.invalidateQueries({ queryKey: documentTypeQueryKeys.all })
  }

  // Parchea document_type_folder_id en toda la caché de listados de tipos de documento
  // (cada combinación de filtros/página vive bajo su propia query key). El badge de
  // conteo por carpeta en la página se deriva en cliente de esta misma lista, así que
  // patchear acá alcanza para que el drag & drop no dependa del refetch para verse bien.
  const patchDocumentTypeFolderId = (ids: Set<string>, nextFolderId: string | null) => {
    const snapshot = queryClient.getQueriesData<DocumentTypesResponse>({ queryKey: documentTypeQueryKeys.all })
    queryClient.setQueriesData<DocumentTypesResponse>({ queryKey: documentTypeQueryKeys.all }, (old) => {
      if (!old) return old
      return {
        ...old,
        data: old.data.map((dt) => (ids.has(dt.id) ? { ...dt, document_type_folder_id: nextFolderId } : dt)),
      }
    })
    return snapshot
  }

  const rollback = (snapshot: [QueryKey, DocumentTypesResponse | undefined][]) => {
    for (const [key, data] of snapshot) queryClient.setQueryData(key, data)
  }

  const createFolder = useMutation({
    mutationFn: (data: CreateDocumentTypeFolderData) => createDocumentTypeFolder(data),
    // Sin meta.successMessage: la página muestra su propio toast (con "Deshacer" —
    // ver assets-types.tsx) en vez del genérico de MutationCache.onSuccess.
    onSuccess: invalidateFolderAndTypeLists,
  })

  const updateFolder = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentTypeFolderData }) =>
      updateDocumentTypeFolder(id, data),
    meta: { successMessage: 'Folder updated successfully' },
    onSuccess: invalidateFolderAndTypeLists,
  })

  const deleteFolder = useMutation({
    mutationFn: (id: string) => deleteDocumentTypeFolder(id),
    meta: { successMessage: 'Folder deleted successfully' },
    onSuccess: invalidateFolderAndTypeLists,
  })

  const assignDocumentTypes = useMutation({
    mutationFn: ({ folderId, data }: { folderId: string; data: AssignDocumentTypesToFolderData }) =>
      assignDocumentTypesToFolder(folderId, data),
    onMutate: async ({ folderId, data }) => {
      await queryClient.cancelQueries({ queryKey: documentTypeQueryKeys.all })
      return { snapshot: patchDocumentTypeFolderId(new Set(data.document_type_ids), folderId) }
    },
    onError: (_err, _vars, context) => context && rollback(context.snapshot),
    onSettled: invalidateFolderAndTypeLists,
  })

  const removeDocumentType = useMutation({
    mutationFn: ({ folderId, documentTypeId }: { folderId: string; documentTypeId: string }) =>
      removeDocumentTypeFromFolder(folderId, documentTypeId),
    onMutate: async ({ documentTypeId }) => {
      await queryClient.cancelQueries({ queryKey: documentTypeQueryKeys.all })
      return { snapshot: patchDocumentTypeFolderId(new Set([documentTypeId]), null) }
    },
    onError: (_err, _vars, context) => context && rollback(context.snapshot),
    onSettled: invalidateFolderAndTypeLists,
  })

  return {
    createFolder,
    updateFolder,
    deleteFolder,
    assignDocumentTypes,
    removeDocumentType,
  }
}
