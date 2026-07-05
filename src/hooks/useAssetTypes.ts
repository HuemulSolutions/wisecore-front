import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAssetTypes, getAssetTypesWithRoles, getAssetType, createAssetType, updateAssetType, deleteAssetType, cloneAssetType, getDocumentTypeTemplates, linkTemplateToDocumentType, unlinkTemplateFromDocumentType } from "@/services/asset-types"

// Query keys
export const assetTypeQueryKeys = {
  all: ['asset-types'] as const,
  list: () => [...assetTypeQueryKeys.all, 'list'] as const,
  listWithRoles: () => [...assetTypeQueryKeys.all, 'list-with-roles'] as const,
  detail: (id: string) => [...assetTypeQueryKeys.all, 'detail', id] as const,
  templates: (documentTypeId: string) =>
    [...assetTypeQueryKeys.detail(documentTypeId), 'templates'] as const,
}

// Hook for fetching asset types
export function useAssetTypes() {
  return useQuery({
    queryKey: assetTypeQueryKeys.list(),
    queryFn: () => getAssetTypes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: true, // Refetch on mount to ensure fresh data
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on window focus
    retry: 0, // No retries to avoid multiple error requests
  })
}

// Hook for fetching asset types with roles
export function useAssetTypesWithRoles(page: number = 1, pageSize: number = 100, enabled: boolean = true, search?: string) {
  return useQuery({
    queryKey: [...assetTypeQueryKeys.listWithRoles(), page, pageSize, search ?? ''],
    queryFn: () => getAssetTypesWithRoles(page, pageSize, search),
    placeholderData: (prev) => prev,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: true, // Refetch on mount to ensure fresh data
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on window focus
    retry: 0, // No retries to avoid multiple error requests
  })
}

// Hook for fetching single asset type
export function useAssetType(id: string) {
  return useQuery({
    queryKey: assetTypeQueryKeys.detail(id),
    queryFn: () => getAssetType(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for fetching templates linked to a document type
export function useDocumentTypeTemplates(documentTypeId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: assetTypeQueryKeys.templates(documentTypeId),
    queryFn: () => getDocumentTypeTemplates(documentTypeId),
    enabled: enabled && !!documentTypeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

// Hook for asset type mutations
export function useAssetTypeMutations() {
  const queryClient = useQueryClient()

  const createAssetTypeMutation = useMutation({
    mutationFn: createAssetType,
    meta: { successMessage: 'Asset type created successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.list() })
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.listWithRoles() })
    },
  })

  const updateAssetTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      updateAssetType(id, data),
    meta: { successMessage: 'Asset type updated successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.list() })
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.listWithRoles() })
    },
  })

  const deleteAssetTypeMutation = useMutation({
    mutationFn: deleteAssetType,
    meta: { successMessage: 'Asset type deleted successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.list() })
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.listWithRoles() })
      queryClient.invalidateQueries({ queryKey: ['document-types'] })
    },
  })

  const cloneAssetTypeMutation = useMutation({
    mutationFn: ({ id, includeRelationships }: { id: string; includeRelationships: boolean }) =>
      cloneAssetType(id, { include_relationships: includeRelationships }),
    meta: { successMessage: 'Asset type cloned successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.list() })
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.listWithRoles() })
      queryClient.invalidateQueries({ queryKey: ['document-types'] })
    },
  })

  const linkTemplateMutation = useMutation({
    mutationFn: ({ documentTypeId, templateId }: { documentTypeId: string; templateId: string }) =>
      linkTemplateToDocumentType(documentTypeId, templateId),
    meta: { successMessage: 'Template linked successfully' },
    onSuccess: (_data, { documentTypeId }) => {
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.templates(documentTypeId) })
    },
  })

  const unlinkTemplateMutation = useMutation({
    mutationFn: ({ documentTypeId, templateId }: { documentTypeId: string; templateId: string }) =>
      unlinkTemplateFromDocumentType(documentTypeId, templateId),
    meta: { successMessage: 'Template unlinked successfully' },
    onSuccess: (_data, { documentTypeId }) => {
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.templates(documentTypeId) })
    },
  })

  return {
    createAssetType: createAssetTypeMutation,
    updateAssetType: updateAssetTypeMutation,
    deleteAssetType: deleteAssetTypeMutation,
    cloneAssetType: cloneAssetTypeMutation,
    linkTemplate: linkTemplateMutation,
    unlinkTemplate: unlinkTemplateMutation,
  }
}