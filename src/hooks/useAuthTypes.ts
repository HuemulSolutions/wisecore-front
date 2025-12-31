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
import { toast } from "sonner"

// Query keys
export const authTypeQueryKeys = {
  all: ['auth-types'] as const,
  list: () => [...authTypeQueryKeys.all, 'list'] as const,
  types: () => [...authTypeQueryKeys.all, 'types'] as const,
  detail: (id: string) => [...authTypeQueryKeys.all, 'detail', id] as const,
}

// Hook for fetching auth types
export function useAuthTypes() {
  return useQuery({
    queryKey: authTypeQueryKeys.list(),
    queryFn: getAuthTypes,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 0, // No retries to avoid multiple error requests
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.list() })
      toast.success('Authentication type created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create authentication type: ' + error.message)
    },
  })

  const updateAuthTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAuthTypeRequest }) => 
      updateAuthType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.list() })
      toast.success('Authentication type updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update authentication type: ' + error.message)
    },
  })

  const deleteAuthTypeMutation = useMutation({
    mutationFn: deleteAuthType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.list() })
      toast.success('Authentication type deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete authentication type: ' + error.message)
    },
  })

  return {
    createAuthType: createAuthTypeMutation,
    updateAuthType: updateAuthTypeMutation,
    deleteAuthType: deleteAuthTypeMutation,
  }
}