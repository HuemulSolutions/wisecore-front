import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAssetTypes, getAssetTypesWithRoles, getAssetType, createAssetType, updateAssetType, deleteAssetType, cloneAssetType, getDocumentTypeTemplates, linkTemplateToDocumentType, updateDocumentTypeTemplate, unlinkTemplateFromDocumentType } from "@/services/asset-types"
import type { DocumentTypeTemplateLinkBody } from "@/types/assets"

// Query keys
export const assetTypeQueryKeys = {
  all: ['asset-types'] as const,
  list: (tagId?: string) => [...assetTypeQueryKeys.all, 'list', tagId ?? ''] as const,
  listWithRoles: () => [...assetTypeQueryKeys.all, 'list-with-roles'] as const,
  detail: (id: string) => [...assetTypeQueryKeys.all, 'detail', id] as const,
  templates: (documentTypeId: string) =>
    [...assetTypeQueryKeys.detail(documentTypeId), 'templates'] as const,
}

// Hook for fetching asset types
export function useAssetTypes(tagId?: string) {
  return useQuery({
    queryKey: assetTypeQueryKeys.list(tagId),
    queryFn: () => getAssetTypes(1, 100, undefined, tagId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnMount: true, // Refetch on mount to ensure fresh data
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on window focus
    retry: 0, // No retries to avoid multiple error requests
  })
}

// Hook for fetching asset types with roles
export function useAssetTypesWithRoles(page: number = 1, pageSize: number = 100, enabled: boolean = true, search?: string, tagId?: string) {
  return useQuery({
    queryKey: [...assetTypeQueryKeys.listWithRoles(), page, pageSize, search ?? '', tagId ?? ''],
    queryFn: () => getAssetTypesWithRoles(page, pageSize, search, tagId),
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
    mutationFn: ({ documentTypeId, templateId, body }: { documentTypeId: string; templateId: string; body?: DocumentTypeTemplateLinkBody }) =>
      linkTemplateToDocumentType(documentTypeId, templateId, body),
    meta: { successMessage: 'Template linked successfully' },
    onSuccess: (_data, { documentTypeId }) => {
      queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.templates(documentTypeId) })
    },
  })

  const updateTemplateLinkMutation = useMutation({
    mutationFn: ({ documentTypeId, templateId, body }: { documentTypeId: string; templateId: string; body: DocumentTypeTemplateLinkBody }) =>
      updateDocumentTypeTemplate(documentTypeId, templateId, body),
    meta: { successMessage: 'Template updated successfully' },
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
    updateTemplateLink: updateTemplateLinkMutation,
    unlinkTemplate: unlinkTemplateMutation,
  }
}