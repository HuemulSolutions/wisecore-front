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
  // La lista es de la organización activa: la key la incluye para que al cambiar de
  // organización no se muestre la lista cacheada de la anterior.
  list: (organizationId: string | null, search?: string, onlyActive?: boolean) =>
    [...authTypeQueryKeys.all, 'list', organizationId ?? '', search ?? '', onlyActive ? 'active' : 'all'] as const,
  types: () => [...authTypeQueryKeys.all, 'types'] as const,
  detail: (id: string) => [...authTypeQueryKeys.all, 'detail', id] as const,
}

/**
 * Conexiones de la organización activa. El backend las acota por el claim `org_id`
 * del token de organización para todos los usuarios (root admin incluido); sin
 * organización activa no se consulta.
 */
export function useAuthTypes(options?: { enabled?: boolean; search?: string; onlyActive?: boolean }) {
  const { selectedOrganizationId, organizationToken } = useOrganization()
  const search = options?.search || undefined
  const onlyActive = options?.onlyActive ?? false
  const hasOrganization = !!selectedOrganizationId && !!organizationToken
  return useQuery({
    queryKey: authTypeQueryKeys.list(selectedOrganizationId, search, onlyActive),
    queryFn: () => getAuthTypes(search, { onlyActive }),
    // El placeholder reutiliza los datos previos solo si son de la misma organización:
    // incluir la org en la key no alcanza, porque TanStack entrega los datos de la key
    // anterior mientras carga la nueva y se verían conexiones de la organización anterior.
    placeholderData: (prev, prevQuery) =>
      prevQuery?.queryKey[2] === (selectedOrganizationId ?? '') ? prev : undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 0, // No retries to avoid multiple error requests
    enabled: (options?.enabled ?? true) && hasOrganization,
  })
}

/**
 * Conexiones que se pueden asignar a una membresía de `organizationId` (por
 * defecto la organización activa): las activas de ESA organización, su `INTERNAL`
 * incluida (docs/sso-frontend.md, Fase 6; misma regla que
 * `validate_connection_for_organization` en el backend).
 *
 * Solo se resuelven para la organización activa: el backend no entrega
 * conexiones de otra organización a nadie, tampoco al root admin. Cuando
 * `organizationId` es otra (p. ej. el root admin mirando otra organización desde
 * `/organizations`), `isOtherOrganization` es `true` y `eligible` queda vacío.
 */
export function useEligibleAuthTypes(options: { organizationId?: string | null; enabled?: boolean } = {}) {
  const { selectedOrganizationId } = useOrganization()
  const organizationId = options.organizationId ?? selectedOrganizationId
  const isOtherOrganization =
    !!organizationId && (!selectedOrganizationId || organizationId.toLowerCase() !== selectedOrganizationId.toLowerCase())
  const query = useAuthTypes({ enabled: (options.enabled ?? true) && !isOtherOrganization, onlyActive: true })
  const eligible = useMemo(
    () =>
      isOtherOrganization
        ? []
        : (query.data ?? []).filter(
            (item) => item.is_active && item.organization_id.toLowerCase() === (organizationId ?? '').toLowerCase(),
          ),
    [query.data, organizationId, isOtherOrganization],
  )
  return { ...query, eligible, isOtherOrganization }
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
