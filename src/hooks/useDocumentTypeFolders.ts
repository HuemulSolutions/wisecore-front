import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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

  const createFolder = useMutation({
    mutationFn: (data: CreateDocumentTypeFolderData) => createDocumentTypeFolder(data),
    meta: { successMessage: 'Folder created successfully' },
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
    onSuccess: invalidateFolderAndTypeLists,
  })

  const removeDocumentType = useMutation({
    mutationFn: ({ folderId, documentTypeId }: { folderId: string; documentTypeId: string }) =>
      removeDocumentTypeFromFolder(folderId, documentTypeId),
    onSuccess: invalidateFolderAndTypeLists,
  })

  return {
    createFolder,
    updateFolder,
    deleteFolder,
    assignDocumentTypes,
    removeDocumentType,
  }
}
