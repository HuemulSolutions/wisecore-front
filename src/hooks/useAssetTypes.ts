import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getAssetTypes, getAssetTypesWithRoles, getAssetType, createAssetType, updateAssetType, deleteAssetType } from "@/services/asset-types"

// Query keys
export const assetTypeQueryKeys = {
  all: ['asset-types'] as const,
  list: () => [...assetTypeQueryKeys.all, 'list'] as const,
  listWithRoles: () => [...assetTypeQueryKeys.all, 'list-with-roles'] as const,
  detail: (id: string) => [...assetTypeQueryKeys.all, 'detail', id] as const,
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
export function useAssetTypesWithRoles(page: number = 1, pageSize: number = 10, enabled: boolean = true, search?: string) {
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
    },
  })

  return {
    createAssetType: createAssetTypeMutation,
    updateAssetType: updateAssetTypeMutation,
    deleteAssetType: deleteAssetTypeMutation,
  }
}