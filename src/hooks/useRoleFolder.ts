import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  getRoleFolderAccessLevels,
  getRoleFolderPermissionsByRole,
  getRoleFolderPermissionsByFolder,
  createRoleFolder,
  updateRoleFolder,
  deleteRoleFolder,
} from '@/services/role-folder'
import type {
  CreateRoleFolderRequest,
  UpdateRoleFolderRequest,
} from '@/types/role-folder'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const roleFolderQueryKeys = {
  all: ['role-folder'] as const,
  listBase: () => [...roleFolderQueryKeys.all, 'list'] as const,
  accessLevels: (organizationId: string) =>
    [...roleFolderQueryKeys.all, 'access-levels', organizationId] as const,
  byRole: (organizationId: string, roleId: string, page: number, pageSize: number) =>
    [...roleFolderQueryKeys.listBase(), 'by-role', organizationId, roleId, page, pageSize] as const,
  byFolder: (organizationId: string, folderId: string, page: number, pageSize: number) =>
    [...roleFolderQueryKeys.listBase(), 'by-folder', organizationId, folderId, page, pageSize] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseRoleFolderListOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
}

// ─── Access levels query ────────────────────────────────────────────────────────

export function useRoleFolderAccessLevels(organizationId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: roleFolderQueryKeys.accessLevels(organizationId),
    queryFn: () => getRoleFolderAccessLevels(organizationId),
    enabled: enabled && !!organizationId,
    staleTime: 10 * 60 * 1000,
    retry: 0,
  })
}

// ─── List by role ─────────────────────────────────────────────────────────────

export function useRoleFolderPermissionsByRole(
  organizationId: string,
  roleId: string,
  options: UseRoleFolderListOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 100 } = options

  return useQuery({
    queryKey: roleFolderQueryKeys.byRole(organizationId, roleId, page, pageSize),
    queryFn: () =>
      getRoleFolderPermissionsByRole(organizationId, roleId, { page, page_size: pageSize }),
    enabled: enabled && !!organizationId && !!roleId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── List by folder ───────────────────────────────────────────────────────────

export function useRoleFolderPermissionsByFolder(
  organizationId: string,
  folderId: string,
  options: UseRoleFolderListOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 100 } = options

  return useQuery({
    queryKey: roleFolderQueryKeys.byFolder(organizationId, folderId, page, pageSize),
    queryFn: () =>
      getRoleFolderPermissionsByFolder(organizationId, folderId, { page, page_size: pageSize }),
    enabled: enabled && !!organizationId && !!folderId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useRoleFolderMutations(organizationId: string) {
  const queryClient = useQueryClient()
  const { t } = useTranslation('role-folder')

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: roleFolderQueryKeys.listBase() })

  // Cada mutación se dispara individualmente apenas el usuario actúa (sin diff
  // ni guardado bulk), así que cada una anuncia su propio toast de éxito.
  const createMutation = useMutation({
    mutationFn: (body: CreateRoleFolderRequest) => createRoleFolder(organizationId, body),
    meta: { successMessage: t('createSuccess') },
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: (body: UpdateRoleFolderRequest) => updateRoleFolder(organizationId, body),
    meta: { successMessage: t('updateSuccess') },
    onSuccess: invalidateList,
  })

  const deleteMutation = useMutation({
    mutationFn: ({ roleId, folderId }: { roleId: string; folderId: string }) =>
      deleteRoleFolder(organizationId, roleId, folderId),
    meta: { successMessage: t('revokeSuccess') },
    onSuccess: invalidateList,
  })

  return {
    createRoleFolder: createMutation,
    updateRoleFolder: updateMutation,
    deleteRoleFolder: deleteMutation,
  }
}
