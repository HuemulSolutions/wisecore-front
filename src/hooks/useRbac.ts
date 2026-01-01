import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getRoles, createRole, getPermissions, getRolePermissions, getUserRoles, getUserAllRoles, assignRolesToUser, updateRole, deleteRole, getRoleWithAllUsers, assignUsersToRole } from "@/services/rbac"
import { toast } from "sonner"

// Query keys
export const rbacQueryKeys = {
  all: ['rbac'] as const,
  roles: () => [...rbacQueryKeys.all, 'roles'] as const,
  permissions: () => [...rbacQueryKeys.all, 'permissions'] as const,
  rolePermissions: (roleId: string) => [...rbacQueryKeys.all, 'rolePermissions', roleId] as const,
  userRoles: (userId: string) => [...rbacQueryKeys.all, 'userRoles', userId] as const,
  userAllRoles: (userId: string) => [...rbacQueryKeys.all, 'userAllRoles', userId] as const,
  roleWithAllUsers: (roleId: string) => [...rbacQueryKeys.all, 'roleWithAllUsers', roleId] as const,
}

// Hook for fetching roles
export function useRoles(enabled: boolean = true) {
  return useQuery({
    queryKey: rbacQueryKeys.roles(),
    queryFn: getRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true, // Ensure fresh data on mount
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    retry: 0, // No retries to avoid multiple error requests
    enabled,
  })
}

// Hook for fetching permissions
export function usePermissions(enabled: boolean = true) {
  return useQuery({
    queryKey: rbacQueryKeys.permissions(),
    queryFn: getPermissions,
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions change less frequently
    enabled,
  })
}

// Hook for fetching permissions of a specific role
export function useRolePermissions(roleId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: rbacQueryKeys.rolePermissions(roleId),
    queryFn: () => getRolePermissions(roleId),
    enabled: !!roleId && enabled,
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true, // Refetch when component mounts
  })
}

// Hook for fetching user roles
export function useUserRoles(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: rbacQueryKeys.userRoles(userId),
    queryFn: () => getUserRoles(userId),
    enabled: !!userId && userId.trim() !== '' && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1, // Reduce retries to prevent excessive requests
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  })
}

// Hook for fetching all roles with user assignment status
export function useUserAllRoles(userId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: rbacQueryKeys.userAllRoles(userId),
    queryFn: () => getUserAllRoles(userId),
    enabled: !!userId && userId.trim() !== '' && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

// Hook for fetching role with all users and their assignment status
export function useRoleWithAllUsers(roleId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: rbacQueryKeys.roleWithAllUsers(roleId),
    queryFn: () => getRoleWithAllUsers(roleId),
    enabled: !!roleId && roleId.trim() !== '' && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

// Hook for role mutations
export function useRoleMutations() {
  const queryClient = useQueryClient()

  const createRoleMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
      toast.success('Role created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create role: ' + error.message)
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: any }) => 
      updateRole(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
      // Don't invalidate rolePermissions here - it should only refetch when sheet opens
      toast.success('Role updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message)
    },
  })

  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
      toast.success('Role deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete role: ' + error.message)
    },
  })

  const assignRolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      assignRolesToUser(userId, { role_ids: roleIds }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.userRoles(userId) })
      toast.success('Roles assigned successfully')
    },
    onError: (error) => {
      toast.error('Failed to assign roles: ' + error.message)
    },
  })

  const assignUsersToRoleMutation = useMutation({
    mutationFn: ({ roleId, userIds }: { roleId: string; userIds: string[] }) =>
      assignUsersToRole(roleId, userIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roleWithAllUsers(roleId) })
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
      toast.success('Users assigned successfully')
    },
    onError: (error) => {
      toast.error('Failed to assign users: ' + error.message)
    },
  })

  return {
    createRole: createRoleMutation,
    updateRole: updateRoleMutation,
    deleteRole: deleteRoleMutation,
    assignRoles: assignRolesMutation,
    assignUsersToRole: assignUsersToRoleMutation,
  }
}