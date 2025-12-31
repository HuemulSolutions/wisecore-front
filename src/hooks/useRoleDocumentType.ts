import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  getAccessLevels, 
  getAccessLevel, 
  getRolePermissions, 
  getDocumentTypePermissions,
  getDocumentTypeRolesAccessLevels,
  grantAccess, 
  revokeAccess, 
  updateAccess,
  bulkGrantAccess
} from "@/services/role-document-type"
import { toast } from "sonner"

// Query keys
export const roleDocumentTypeQueryKeys = {
  all: ['role-document-type'] as const,
  accessLevels: () => [...roleDocumentTypeQueryKeys.all, 'access-levels'] as const,
  accessLevel: (roleId: string, documentTypeId: string) => [...roleDocumentTypeQueryKeys.all, 'access-level', roleId, documentTypeId] as const,
  rolePermissions: (roleId: string) => [...roleDocumentTypeQueryKeys.all, 'role-permissions', roleId] as const,
  documentTypePermissions: (documentTypeId: string) => [...roleDocumentTypeQueryKeys.all, 'document-type-permissions', documentTypeId] as const,
  documentTypeRolesAccessLevels: (documentTypeId: string) => [...roleDocumentTypeQueryKeys.all, 'document-type-roles-access-levels', documentTypeId] as const,
}

// Hook for fetching access levels
export function useAccessLevels(enabled: boolean = true) {
  return useQuery({
    queryKey: roleDocumentTypeQueryKeys.accessLevels(),
    queryFn: getAccessLevels,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - access levels change rarely
  })
}

// Hook for fetching access level for specific role and document type
export function useAccessLevel(roleId: string, documentTypeId: string) {
  return useQuery({
    queryKey: roleDocumentTypeQueryKeys.accessLevel(roleId, documentTypeId),
    queryFn: () => getAccessLevel(roleId, documentTypeId),
    enabled: !!roleId && !!documentTypeId,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for fetching role permissions
export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: roleDocumentTypeQueryKeys.rolePermissions(roleId),
    queryFn: () => getRolePermissions(roleId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for fetching document type permissions
export function useDocumentTypePermissions(documentTypeId: string) {
  return useQuery({
    queryKey: roleDocumentTypeQueryKeys.documentTypePermissions(documentTypeId),
    queryFn: () => getDocumentTypePermissions(documentTypeId),
    enabled: !!documentTypeId,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for fetching all roles with access levels for a document type (combined endpoint)
export function useDocumentTypeRolesAccessLevels(documentTypeId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: roleDocumentTypeQueryKeys.documentTypeRolesAccessLevels(documentTypeId),
    queryFn: () => getDocumentTypeRolesAccessLevels(documentTypeId),
    enabled: !!documentTypeId && enabled,
    staleTime: 0, // Always refetch to ensure fresh data
    refetchOnMount: true,
  })
}

// Hook for role document type mutations
export function useRoleDocumentTypeMutations() {
  const queryClient = useQueryClient()

  const grantAccessMutation = useMutation({
    mutationFn: grantAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleDocumentTypeQueryKeys.documentTypePermissions('') })
      queryClient.invalidateQueries({ queryKey: ['asset-types', 'list-with-roles'] })
      queryClient.invalidateQueries({ queryKey: ['document-types'] })
      toast.success('Access granted successfully')
    },
    onError: (error) => {
      toast.error('Failed to grant access: ' + error.message)
    },
  })

  const revokeAccessMutation = useMutation({
    mutationFn: ({ roleId, documentTypeId }: { roleId: string; documentTypeId: string }) => 
      revokeAccess(roleId, documentTypeId),
    onSuccess: () => {
      // Don't invalidate documentTypeRolesAccessLevels - it should only refetch when dialog opens
      queryClient.invalidateQueries({ queryKey: ['asset-types', 'list-with-roles'] })
      queryClient.invalidateQueries({ queryKey: ['document-types'] })
      toast.success('Access revoked successfully')
    },
    onError: (error) => {
      toast.error('Failed to revoke access: ' + error.message)
    },
  })

  const updateAccessMutation = useMutation({
    mutationFn: ({ roleDocTypeId, accessLevel }: { roleDocTypeId: string; accessLevel: string }) => 
      updateAccess(roleDocTypeId, accessLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-types', 'list-with-roles'] })
      queryClient.invalidateQueries({ queryKey: ['document-types'] })
      toast.success('Access updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update access: ' + error.message)
    },
  })

  const bulkGrantAccessMutation = useMutation({
    mutationFn: bulkGrantAccess,
    onSuccess: () => {
      // Don't invalidate documentTypeRolesAccessLevels - it should only refetch when dialog opens
      queryClient.invalidateQueries({ queryKey: ['asset-types', 'list-with-roles'] })
      queryClient.invalidateQueries({ queryKey: ['document-types'] })
      toast.success('All permissions granted successfully')
    },
    onError: (error) => {
      toast.error('Failed to grant permissions: ' + error.message)
    },
  })

  return {
    grantAccess: grantAccessMutation,
    revokeAccess: revokeAccessMutation,
    updateAccess: updateAccessMutation,
    bulkGrantAccess: bulkGrantAccessMutation,
    // Legacy name for backward compatibility
    assignPermissions: grantAccessMutation,
    bulkAssignPermissions: bulkGrantAccessMutation,
  }
}