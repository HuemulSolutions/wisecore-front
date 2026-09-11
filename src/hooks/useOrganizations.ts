import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import {
  getAllOrganizations,
  addOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationUsers,
  setOrganizationAdmin,
} from "@/services/organizations"
import type { Organization } from "@/types/organizations"

// Query keys for organizations
export const organizationQueryKeys = {
  all: ['organizations'] as const,
  listBase: () => [...organizationQueryKeys.all, 'list'] as const,
  list: (organizationId: string | null, page: number, pageSize: number, search?: string) => [
    ...organizationQueryKeys.listBase(),
    organizationId ?? '',
    page,
    pageSize,
    search ?? '',
  ] as const,
  /** Catálogo acotado para resolver deep-links del panel — ver `useOrganizationsLookup`. */
  lookup: () => [...organizationQueryKeys.all, 'lookup'] as const,
  // Prefijo invalidable: `users(id)` con page/pageSize `undefined` NO matchea
  // por índice a `[...,id,1,100]` (TanStack compara posición a posición, no
  // por objeto). Toda invalidación de "los usuarios de esta organización"
  // tiene que apuntar a `usersBase`, nunca a `users(...)` con defaults.
  usersBase: (organizationId?: string) => [...organizationQueryKeys.all, 'users', organizationId] as const,
  users: (organizationId?: string, page = 1, pageSize = 100) => [
    ...organizationQueryKeys.usersBase(organizationId),
    page,
    pageSize,
  ] as const,
}

interface UseOrganizationsOptions {
  /** Organización activa del usuario (header X-Org-Id) — no filtra el listado, solo entra a la key. */
  organizationId?: string | null
  page?: number
  pageSize?: number
  search?: string
  enabled?: boolean
}

/** Lista paginada de organizaciones — compartida entre `/organizations` y `/global-admin`. */
export function useOrganizations({
  organizationId = null,
  page = 1,
  pageSize = 100,
  search,
  enabled = true,
}: UseOrganizationsOptions = {}) {
  return useQuery({
    queryKey: organizationQueryKeys.list(organizationId, page, pageSize, search),
    queryFn: () => getAllOrganizations(page, pageSize, search?.trim() || undefined),
    enabled,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

const ORGANIZATIONS_LOOKUP_PAGE_SIZE = 200

/**
 * Resuelve deep-links `?organization=<id>` cuando el id no está en la página
 * visible de la tabla — no existe `GET /organizations/{id}`. Espejo acotado
 * de `useRolesMap`: acá no se crea un context porque ningún otro consumidor
 * necesita el catálogo completo.
 */
export function useOrganizationsLookup(enabled: boolean) {
  const query = useQuery({
    queryKey: organizationQueryKeys.lookup(),
    queryFn: () => getAllOrganizations(1, ORGANIZATIONS_LOOKUP_PAGE_SIZE),
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  })

  const byId = useMemo(() => {
    const data = (query.data?.data ?? []) as Organization[]
    return Object.fromEntries(data.map((org) => [org.id, org])) as Record<string, Organization>
  }, [query.data])

  return { byId, isFetched: query.isFetched, isFetching: query.isFetching }
}

/** Create/update/delete de organizaciones — toasts vía `meta.successMessage` (ver `query-client.ts`). */
export function useOrganizationMutations() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('organizations')

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: organizationQueryKeys.listBase() })
    queryClient.invalidateQueries({ queryKey: organizationQueryKeys.lookup() })
  }

  const createOrganization = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => addOrganization(payload),
    meta: { successMessage: t('toasts.created') },
    onSuccess: invalidateList,
  })

  const updateOrganizationMutation = useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data: { name: string; description?: string; max_users?: number | null; token_limit?: number | null }
    }) => updateOrganization(id, data),
    meta: { successMessage: t('toasts.updated') },
    onSuccess: invalidateList,
  })

  const deleteOrganizationMutation = useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    meta: { successMessage: t('toasts.deleted') },
    onSuccess: (_data, id) => {
      invalidateList()
      queryClient.removeQueries({ queryKey: organizationQueryKeys.usersBase(id) })
    },
  })

  return {
    createOrganization,
    updateOrganization: updateOrganizationMutation,
    deleteOrganization: deleteOrganizationMutation,
  }
}

// Hook for fetching users of a specific organization (root admin only)
export function useOrganizationUsers(
  organizationId?: string,
  page: number = 1,
  pageSize: number = 100
) {
  return useQuery({
    queryKey: organizationQueryKeys.users(organizationId, page, pageSize),
    queryFn: () => getOrganizationUsers(organizationId!, page, pageSize),
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

// Hook for setting organization admin mutation
export function useSetOrganizationAdmin() {
  const queryClient = useQueryClient()
  const { t } = useTranslation('organizations')

  return useMutation({
    mutationFn: ({ organizationId, userId }: { organizationId: string; userId: string }) =>
      setOrganizationAdmin(organizationId, userId),
    meta: { successMessage: t('toasts.adminSet') },
    onSuccess: (_, variables) => {
      // Invalidate the users query for this organization to refresh is_org_admin status.
      // Prefijo `usersBase`, no `users(...)` con defaults — ver comentario en organizationQueryKeys.
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.usersBase(variables.organizationId)
      })
    },
  })
}
