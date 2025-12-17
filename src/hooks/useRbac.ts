import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getRoles, createRole, getPermissions, getRolePermissions, getUserRoles, assignRolesToUser, updateRole, deleteRole } from "@/services/rbac"
import { toast } from "sonner"

// Query keys
export const rbacQueryKeys = {
  all: ['rbac'] as const,
  roles: () => [...rbacQueryKeys.all, 'roles'] as const,
  permissions: () => [...rbacQueryKeys.all, 'permissions'] as const,
  rolePermissions: (roleId: string) => [...rbacQueryKeys.all, 'rolePermissions', roleId] as const,
  userRoles: (userId: string) => [...rbacQueryKeys.all, 'userRoles', userId] as const,
}

// Hook for fetching roles
export function useRoles() {
  return useQuery({
    queryKey: rbacQueryKeys.roles(),
    queryFn: getRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching permissions
export function usePermissions() {
  return useQuery({
    queryKey: rbacQueryKeys.permissions(),
    queryFn: getPermissions,
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions change less frequently
  })
}

// Hook for fetching permissions of a specific role
export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: rbacQueryKeys.rolePermissions(roleId),
    queryFn: () => getRolePermissions(roleId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching user roles
export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: rbacQueryKeys.userRoles(userId),
    queryFn: () => getUserRoles(userId),
    enabled: !!userId && userId.trim() !== '',
    staleTime: 5 * 60 * 1000,
    retry: 1, // Reduce retries to prevent excessive requests
    refetchOnWindowFocus: false, // Prevent refetch on window focus
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
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() })
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.rolePermissions(roleId) })
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

  return {
    createRole: createRoleMutation,
    updateRole: updateRoleMutation,
    deleteRole: deleteRoleMutation,
    assignRoles: assignRolesMutation,
  }
}