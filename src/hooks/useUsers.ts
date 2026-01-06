import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, approveUser, rejectUser, deleteUser, updateUser, createUser, getUserOrganizations } from "@/services/users"
import { toast } from "sonner"

// Query keys
export const userQueryKeys = {
  all: ['users'] as const,
  list: () => [...userQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...userQueryKeys.all, 'detail', id] as const,
  organizations: (userId?: string) => [...userQueryKeys.all, 'organizations', userId] as const,
}

// Hook for fetching users
export function useUsers(enabled: boolean = true, organizationId?: string, page: number = 1, pageSize: number = 100) {
  return useQuery({
    queryKey: userQueryKeys.list(),
    queryFn: () => getUsers(organizationId, page, pageSize),
    staleTime: 2 * 60 * 1000, // 2 minutes - reasonable cache time
    gcTime: 5 * 60 * 1000, // 5 minutes cache (formerly cacheTime)
    refetchOnMount: true, // Refetch on mount to ensure fresh data
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on window focus
    retry: 0, // No retries to avoid multiple error requests
    enabled,
  })
}

// Hook for user organizations
export function useUserOrganizations(userId?: string) {
  return useQuery({
    queryKey: userQueryKeys.organizations(userId),
    queryFn: () => getUserOrganizations(userId),
    enabled: !!userId, // Only enabled when userId is provided
  })
}

// Hook for user mutations
export function useUserMutations() {
  const queryClient = useQueryClient()

  const approveUserMutation = useMutation({
    mutationFn: approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
      toast.success('User approved successfully')
    },
    onError: (error) => {
      toast.error('Failed to approve user: ' + error.message)
    },
  })

  const rejectUserMutation = useMutation({
    mutationFn: rejectUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
      toast.success('User rejected successfully')
    },
    onError: (error) => {
      toast.error('Failed to reject user: ' + error.message)
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
      toast.success('User deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete user: ' + error.message)
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) => 
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
      toast.success('User updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update user: ' + error.message)
    },
  })

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.list() })
      toast.success('User created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create user: ' + error.message)
    },
  })

  return {
    approveUser: approveUserMutation,
    rejectUser: rejectUserMutation,
    deleteUser: deleteUserMutation,
    updateUser: updateUserMutation,
    createUser: createUserMutation,
  }
}