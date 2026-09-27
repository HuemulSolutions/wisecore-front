import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import i18n from "@/i18n"
import { useOrganization } from "@/contexts/organization-context"
import {
  getAuthTypes,
  getAuthType,
  getAuthTypeTypes,
  createAuthType,
  updateAuthType,
  deleteAuthType,
  type UpdateAuthTypeRequest,
} from "@/services/auth-types"

// Query keys
export const authTypeQueryKeys = {
  all: ['auth-types'] as const,
  list: (search?: string, organizationId?: string | null, onlyActive?: boolean) =>
    [...authTypeQueryKeys.all, 'list', search ?? '', organizationId ?? '', onlyActive ? 'active' : 'all'] as const,
  types: () => [...authTypeQueryKeys.all, 'types'] as const,
  detail: (id: string) => [...authTypeQueryKeys.all, 'detail', id] as const,
}

// Hook for fetching auth types
export function useAuthTypes(options?: { enabled?: boolean; search?: string; organizationId?: string | null; onlyActive?: boolean }) {
  const search = options?.search || undefined
  const organizationId = options?.organizationId ?? undefined
  const onlyActive = options?.onlyActive ?? false
  return useQuery({
    queryKey: authTypeQueryKeys.list(search, organizationId, onlyActive),
    // `organization_id` solo lo honra el backend para root admin; para el org
    // admin la visibilidad la fija `X-Org-Id` y el filtro de abajo hace el resto.
    queryFn: () => getAuthTypes(search, { organizationId, onlyActive }),
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 0, // No retries to avoid multiple error requests
    enabled: options?.enabled ?? true,
  })
}

/**
 * Conexiones que se pueden asignar a una membresía de `organizationId` (por
 * defecto la organización activa): `INTERNAL`, globales activas o activas de esa
 * organización (docs/sso-frontend.md, Fase 6; misma regla que
 * `validate_connection_for_organization` en el backend). El root admin puede
 * mirar otra organización desde `/organizations`, por eso el id es explícito.
 */
export function useEligibleAuthTypes(options: { organizationId?: string | null; enabled?: boolean } = {}) {
  const { selectedOrganizationId } = useOrganization()
  const organizationId = options.organizationId ?? selectedOrganizationId
  const query = useAuthTypes({ enabled: options.enabled ?? true, organizationId, onlyActive: true })
  const eligible = useMemo(
    () =>
      (query.data ?? []).filter(
        (item) => item.is_active && (item.organization_id === null || item.organization_id === organizationId),
      ),
    [query.data, organizationId],
  )
  return { ...query, eligible }
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
    meta: { successMessage: i18n.t('auth-types:toasts.created') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.all })
    },
  })

  const updateAuthTypeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAuthTypeRequest }) =>
      updateAuthType(id, data),
    meta: { successMessage: i18n.t('auth-types:toasts.updated') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.all })
    },
  })

  const deleteAuthTypeMutation = useMutation({
    mutationFn: deleteAuthType,
    meta: { successMessage: i18n.t('auth-types:toasts.deleted') },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authTypeQueryKeys.all })
    },
  })

  return {
    createAuthType: createAuthTypeMutation,
    updateAuthType: updateAuthTypeMutation,
    deleteAuthType: deleteAuthTypeMutation,
  }
}
