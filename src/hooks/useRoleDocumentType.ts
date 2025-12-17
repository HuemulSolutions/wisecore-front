import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  getAccessLevels, 
  getAccessLevel, 
  getRolePermissions, 
  getDocumentTypePermissions,
  grantAccess, 
  revokeAccess, 
  updateAccess 
} from "@/services/role-document-type"
import { toast } from "sonner"

// Query keys
export const roleDocumentTypeQueryKeys = {
  all: ['role-document-type'] as const,
  accessLevels: () => [...roleDocumentTypeQueryKeys.all, 'access-levels'] as const,
  accessLevel: (roleId: string, documentTypeId: string) => [...roleDocumentTypeQueryKeys.all, 'access-level', roleId, documentTypeId] as const,
  rolePermissions: (roleId: string) => [...roleDocumentTypeQueryKeys.all, 'role-permissions', roleId] as const,
  documentTypePermissions: (documentTypeId: string) => [...roleDocumentTypeQueryKeys.all, 'document-type-permissions', documentTypeId] as const,
}

// Hook for fetching access levels
export function useAccessLevels() {
  return useQuery({
    queryKey: roleDocumentTypeQueryKeys.accessLevels(),
    queryFn: getAccessLevels,
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

// Hook for role document type mutations
export function useRoleDocumentTypeMutations() {
  const queryClient = useQueryClient()

  const grantAccessMutation = useMutation({
    mutationFn: grantAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleDocumentTypeQueryKeys.all })
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
      queryClient.invalidateQueries({ queryKey: roleDocumentTypeQueryKeys.all })
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
      queryClient.invalidateQueries({ queryKey: roleDocumentTypeQueryKeys.all })
      toast.success('Access updated successfully')
    },
    onError: (error) => {
      toast.error('Failed to update access: ' + error.message)
    },
  })

  const bulkGrantAccessMutation = useMutation({
    mutationFn: async (permissions: Array<{ role_id: string; document_type_id: string; access_levels: string[] }>) => {
      await Promise.all(permissions.map(permission => grantAccess(permission)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleDocumentTypeQueryKeys.all })
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