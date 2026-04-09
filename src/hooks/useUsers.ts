import { useQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { getUsers, approveUser, rejectUser, deleteUser, updateUser, createUser, getUserOrganizations, updateUserRootAdmin } from "@/services/users"
import type { UpdateUserData } from "@/types/users"

// Query keys
export const userQueryKeys = {
  all: ['users'] as const,
  listBase: () => [...userQueryKeys.all, 'list'] as const,
  list: (organizationId?: string, page?: number, pageSize?: number, search?: string) => [
    ...userQueryKeys.listBase(),
    organizationId ?? 'all',
    page,
    pageSize,
    search ?? ''
  ] as const,
  detail: (id: string) => [...userQueryKeys.all, 'detail', id] as const,
  organizations: (userId?: string) => [...userQueryKeys.all, 'organizations', userId] as const,
}

// Hook for fetching users
export function useUsers(enabled: boolean = true, organizationId?: string, page: number = 1, pageSize: number = 100, search?: string) {
  return useQuery({
    queryKey: userQueryKeys.list(organizationId, page, pageSize, search),
    queryFn: () => getUsers(organizationId, page, pageSize, search),
    staleTime: 2 * 60 * 1000, // 2 minutes - reasonable cache time
    gcTime: 5 * 60 * 1000, // 5 minutes cache (formerly cacheTime)
    refetchOnMount: true, // Refetch on mount to ensure fresh data
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on window focus
    retry: 0, // No retries to avoid multiple error requests
    enabled,
    placeholderData: (prev) => prev, // Keep previous data while loading new page
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
export function useUserMutations(additionalInvalidateKeys: QueryKey[] = []) {
  const queryClient = useQueryClient()
  const invalidateAdditional = () => {
    additionalInvalidateKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey })
    })
  }

  const approveUserMutation = useMutation({
    mutationFn: approveUser,
    meta: { successMessage: 'User approved successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
      invalidateAdditional()
    },
  })

  const rejectUserMutation = useMutation({
    mutationFn: rejectUser,
    meta: { successMessage: 'User rejected successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
      invalidateAdditional()
    },
  })

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    meta: { successMessage: 'User deleted successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
      invalidateAdditional()
    },
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) => 
      updateUser(userId, data),
    meta: { successMessage: 'User updated successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
      invalidateAdditional()
    },
  })

  const createUserMutation = useMutation({
    mutationFn: createUser,
    meta: { successMessage: 'User created successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
      invalidateAdditional()
    },
  })

  const updateRootAdminMutation = useMutation({
    mutationFn: ({ userId, isRootAdmin }: { userId: string; isRootAdmin: boolean }) =>
      updateUserRootAdmin(userId, isRootAdmin),
    meta: { successMessage: 'Root admin status updated successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.listBase() })
      invalidateAdditional()
    },
  })

  return {
    approveUser: approveUserMutation,
    rejectUser: rejectUserMutation,
    deleteUser: deleteUserMutation,
    updateUser: updateUserMutation,
    createUser: createUserMutation,
    updateRootAdmin: updateRootAdminMutation,
  }
}
