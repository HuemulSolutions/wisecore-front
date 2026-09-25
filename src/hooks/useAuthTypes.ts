import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  getAuthTypes, 
  getAuthType, 
  getAuthTypeTypes,
  createAuthType, 
  updateAuthType, 
  deleteAuthType,
  type UpdateAuthTypeRequest 
} from "@/services/auth-types"

// Query keys
export const authTypeQueryKeys = {
  all: ['auth-types'] as const,
  list: (search?: string) => [...authTypeQueryKeys.all, 'list', search ?? ''] as const,
  types: () => [...authTypeQueryKeys.all, 'types'] as const,
  detail: (id: string) => [...authTypeQueryKeys.all, 'detail', id] as const,
}

// Hook for fetching auth types
export function useAuthTypes(options?: { enabled?: boolean; search?: string }) {
  const search = options?.search || undefined
  return useQuery({
    queryKey: authTypeQueryKeys.list(search),
    queryFn: () => getAuthTypes(search),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 0, // No retries to avoid multiple error requests
    enabled: options?.enabled ?? true,
  })
}

// Hook for fetching available auth type types
export function useAuthTypeTypes(enabled: boolean = true) {
  return useQuery({
    queryKey: authTypeQueryKeys.types(),
    queryFn: getAuthTypeTypes,
    staleTime: 30 * 60 * 1000, // 30 minutes (types don't change frequently)
    enabled,
  })
}

// Hook for fetching single auth type
export function useAuthType(id: string) {
  return useQuery({
    queryKey: authTypeQueryKeys.detail(id),
    queryFn: () => getAuthType(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for auth type mutations
export function useAuthTypeMutations() {
  const queryClient = useQueryClient()

  const createAuthTypeMutation = useMutation({
    mutationFn: createAuthType,
    meta: { successMessage: 'Authentication type created successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.list() })
    },
  })

  const updateAuthTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAuthTypeRequest }) => 
      updateAuthType(id, data),
    meta: { successMessage: 'Authentication type updated successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.list() })
    },
  })

  const deleteAuthTypeMutation = useMutation({
    mutationFn: deleteAuthType,
    meta: { successMessage: 'Authentication type deleted successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.list() })
    },
  })

  return {
    createAuthType: createAuthTypeMutation,
    updateAuthType: updateAuthTypeMutation,
    deleteAuthType: deleteAuthTypeMutation,
  }
}