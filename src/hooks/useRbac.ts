import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getRoles, createRole, getPermissions, getRolePermissions, getUserRoles, getUserAllRoles, assignRolesToUser, updateRole, deleteRole, getRoleWithAllUsers, assignUsersToRole, cloneRole } from "@/services/rbac"

// Query keys
export const rbacQueryKeys = {
  all: ['rbac'] as const,
  roles: () => [...rbacQueryKeys.all, 'roles'] as const,
  permissions: () => [...rbacQueryKeys.all, 'permissions'] as const,
  rolePermissions: (roleId: string, search?: string) => [...rbacQueryKeys.all, 'rolePermissions', roleId, search ?? ''] as const,
  userRoles: (userId: string) => [...rbacQueryKeys.all, 'userRoles', userId] as const,
  userAllRoles: (userId: string, page?: number, pageSize?: number, search?: string) => [...rbacQueryKeys.all, 'userAllRoles', userId, page ?? 1, pageSize ?? 10, search ?? ''] as const,
  roleWithAllUsers: (roleId: string, page?: number, pageSize?: number, search?: string) => [...rbacQueryKeys.all, 'roleWithAllUsers', roleId, page ?? 1, pageSize ?? 10, search ?? ''] as const,
}

// Hook for fetching roles
export function useRoles(enabled: boolean = true, page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: [...rbacQueryKeys.roles(), page, pageSize, search ?? ''],
    queryFn: () => getRoles(page, pageSize, search),
    placeholderData: (prev) => prev,
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
export function useRolePermissions(roleId: string, enabled: boolean = true, search?: string) {
  return useQuery({
    queryKey: rbacQueryKeys.rolePermissions(roleId, search),
    queryFn: () => getRolePermissions(roleId, search),
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
export function useUserAllRoles(userId: string, enabled: boolean = true, page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: rbacQueryKeys.userAllRoles(userId, page, pageSize, search),
    queryFn: () => getUserAllRoles(userId, page, pageSize, search),
    enabled: !!userId && userId.trim() !== '' && enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

// Hook for fetching role with all users and their assignment status
export function useRoleWithAllUsers(roleId: string, enabled: boolean = true, page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: rbacQueryKeys.roleWithAllUsers(roleId, page, pageSize, search),
    queryFn: () => getRoleWithAllUsers(roleId, page, pageSize, search),
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
    meta: { successMessage: 'Role created successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: any }) => 
      updateRole(roleId, data),
    meta: { successMessage: 'Role updated successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
      // Don't invalidate rolePermissions here - it should only refetch when sheet opens
    },
  })

  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    meta: { successMessage: 'Role deleted successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
    },
  })

  const assignRolesMutation = useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      assignRolesToUser(userId, { role_ids: roleIds }),
    meta: { successMessage: 'Roles assigned successfully' },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.userRoles(userId) })
    },
  })

  const assignUsersToRoleMutation = useMutation({
    mutationFn: ({ roleId, userIds }: { roleId: string; userIds: string[] }) =>
      assignUsersToRole(roleId, userIds),
    meta: { successMessage: 'Users assigned successfully' },
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roleWithAllUsers(roleId) })
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
    },
  })

  const cloneRoleMutation = useMutation({
    mutationFn: ({ roleId, copyUsers }: { roleId: string; copyUsers: boolean }) =>
      cloneRole(roleId, { copy_users: copyUsers }),
    meta: { successMessage: 'Role cloned successfully' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
    },
  })

  return {
    createRole: createRoleMutation,
    updateRole: updateRoleMutation,
    deleteRole: deleteRoleMutation,
    assignRoles: assignRolesMutation,
    assignUsersToRole: assignUsersToRoleMutation,
    cloneRole: cloneRoleMutation,
  }
}