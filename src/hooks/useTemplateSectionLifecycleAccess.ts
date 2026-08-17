import { useCallback, useMemo } from 'react'
import { useMutation, useMutationState, useQueries, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import {
  clearTemplateSectionLifecycleAccess,
  getTemplateSectionLifecycleAccess,
  setTemplateSectionLifecycleAccess,
} from '@/services/template-section-lifecycle-access'
import type {
  TemplateSectionAccess,
  TemplateSectionLifecycleAccess,
} from '@/types/templates/section-lifecycle-access'

export const templateSectionAccessQueryKeys = {
  all: ['template-section-lifecycle-access'] as const,
  section: (organizationId: string, templateSectionId: string) =>
    [...templateSectionAccessQueryKeys.all, organizationId, templateSectionId] as const,
}

/**
 * Mapa `stepId -> access` de una sección. Un step ausente del mapa está OCULTO
 * para esa sección — el backend no persiste ese caso (ver types/templates/section-lifecycle-access).
 */
export type SectionAccessByStep = ReadonlyMap<string, TemplateSectionAccess>

function toAccessByStep(rows: TemplateSectionLifecycleAccess[]): Map<string, TemplateSectionAccess> {
  return new Map(rows.map((row) => [row.lifecycle_step_id, row.access]))
}

/**
 * Acceso de varias secciones a la vez: una query por sección en vez de una sola
 * lista, para que una mutación invalide solo la fila tocada y no toda la matriz.
 */
export function useTemplateSectionsLifecycleAccess(
  organizationId: string,
  templateSectionIds: string[],
  enabled: boolean = true,
) {
  const queryClient = useQueryClient()

  const results = useQueries({
    queries: templateSectionIds.map((sectionId) => ({
      queryKey: templateSectionAccessQueryKeys.section(organizationId, sectionId),
      queryFn: () => getTemplateSectionLifecycleAccess(organizationId, sectionId),
      enabled: enabled && !!organizationId && !!sectionId,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 0,
    })),
  })

  const isLoading = results.some((r) => r.isLoading)
  const isFetching = results.some((r) => r.isFetching)

  // `results` es un array nuevo en cada render: la dependencia real es el
  // contenido de cada query, no la identidad del array.
  const accessSignature = results.map((r) => (r.data ? JSON.stringify(r.data) : '')).join('|')
  const accessBySection = useMemo(() => {
    const map = new Map<string, SectionAccessByStep>()
    templateSectionIds.forEach((sectionId, index) => {
      map.set(sectionId, toAccessByStep(results[index]?.data ?? []))
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateSectionIds.join('|'), accessSignature])

  const refetchAll = useCallback(
    () => queryClient.invalidateQueries({ queryKey: templateSectionAccessQueryKeys.all }),
    [queryClient],
  )

  return { accessBySection, isLoading, isFetching, refetchAll }
}

// ─── Mutaciones: clave común, optimismo y pendientes por celda ──────────────
//
// Mismo esquema que las mutaciones de steps (`useLifecycle.ts`): una mutationKey
// compartida habilita saber QUÉ celda está en vuelo (sin congelar la tabla entera)
// e invalidar una sola vez al final de una ráfaga de clics.
export const templateSectionAccessMutationKey = (organizationId: string) =>
  ['template-section-lifecycle-access', 'mutation', organizationId] as const

type AccessMutationVariables = { templateSectionId: string; lifecycleStepId: string }

/** Clave de celda usada por el componente para pintar el spinner. */
export const sectionAccessCellKey = (templateSectionId: string, lifecycleStepId: string) =>
  `${templateSectionId}:${lifecycleStepId}`

function cellKeyFromVariables(variables: unknown): string | null {
  if (!variables || typeof variables !== 'object') return null
  const { templateSectionId, lifecycleStepId } = variables as Partial<AccessMutationVariables>
  if (typeof templateSectionId !== 'string' || typeof lifecycleStepId !== 'string') return null
  return sectionAccessCellKey(templateSectionId, lifecycleStepId)
}

/** Celdas con una escritura en vuelo, leídas de la mutation cache. */
export function usePendingSectionAccessCells(organizationId: string): ReadonlySet<string> {
  const pendingCells = useMutationState({
    filters: { mutationKey: templateSectionAccessMutationKey(organizationId), status: 'pending' },
    select: (mutation) => cellKeyFromVariables(mutation.state.variables),
  })
  return useMemo(
    () => new Set(pendingCells.filter((key): key is string => key !== null)),
    [pendingCells],
  )
}

type AccessSnapshot = TemplateSectionLifecycleAccess[] | undefined

/**
 * Aplica el cambio sobre la cache de la sección y devuelve el snapshot previo
 * para el rollback de `onError`. `access === null` significa «volver a oculta».
 */
async function applyOptimisticAccess(
  queryClient: QueryClient,
  organizationId: string,
  templateSectionId: string,
  lifecycleStepId: string,
  access: TemplateSectionAccess | null,
): Promise<AccessSnapshot> {
  const queryKey = templateSectionAccessQueryKeys.section(organizationId, templateSectionId)
  // Un GET en vuelo resolvería después del parche y lo pisaría con datos viejos.
  await queryClient.cancelQueries({ queryKey })
  const snapshot = queryClient.getQueryData<TemplateSectionLifecycleAccess[]>(queryKey)
  queryClient.setQueryData<TemplateSectionLifecycleAccess[]>(queryKey, (previous) => {
    const rows = previous ?? []
    const without = rows.filter((row) => row.lifecycle_step_id !== lifecycleStepId)
    if (access === null) return without
    const existing = rows.find((row) => row.lifecycle_step_id === lifecycleStepId)
    return [
      ...without,
      {
        // El id real lo asigna el backend; el refetch de `onSettled` lo reemplaza.
        id: existing?.id ?? `optimistic-${templateSectionId}-${lifecycleStepId}`,
        template_section_id: templateSectionId,
        lifecycle_step_id: lifecycleStepId,
        access,
      },
    ]
  })
  return snapshot
}

export function useTemplateSectionAccessMutations(organizationId: string) {
  const queryClient = useQueryClient()
  const mutationKey = templateSectionAccessMutationKey(organizationId)

  const restore = (templateSectionId: string, snapshot: AccessSnapshot) => {
    queryClient.setQueryData(
      templateSectionAccessQueryKeys.section(organizationId, templateSectionId),
      snapshot,
    )
  }

  // Solo la última mutación en vuelo refetchea: dentro de `onSettled` la propia
  // mutación sigue contando como pending, así que `=== 1` significa «soy la última».
  const invalidateWhenIdle = (templateSectionId: string) => {
    if (queryClient.isMutating({ mutationKey }) !== 1) return
    return queryClient.invalidateQueries({
      queryKey: templateSectionAccessQueryKeys.section(organizationId, templateSectionId),
    })
  }

  const setAccess = useMutation({
    mutationKey,
    mutationFn: ({
      templateSectionId,
      lifecycleStepId,
      access,
    }: AccessMutationVariables & { access: TemplateSectionAccess }) =>
      setTemplateSectionLifecycleAccess(organizationId, templateSectionId, lifecycleStepId, {
        access,
      }),
    onMutate: ({ templateSectionId, lifecycleStepId, access }) =>
      applyOptimisticAccess(
        queryClient,
        organizationId,
        templateSectionId,
        lifecycleStepId,
        access,
      ).then((snapshot) => ({ snapshot })),
    onError: (_error, { templateSectionId }, context) => restore(templateSectionId, context?.snapshot),
    onSettled: (_data, _error, { templateSectionId }) => invalidateWhenIdle(templateSectionId),
  })

  const clearAccess = useMutation({
    mutationKey,
    mutationFn: ({ templateSectionId, lifecycleStepId }: AccessMutationVariables) =>
      clearTemplateSectionLifecycleAccess(organizationId, templateSectionId, lifecycleStepId),
    onMutate: ({ templateSectionId, lifecycleStepId }) =>
      applyOptimisticAccess(
        queryClient,
        organizationId,
        templateSectionId,
        lifecycleStepId,
        null,
      ).then((snapshot) => ({ snapshot })),
    onError: (_error, { templateSectionId }, context) => restore(templateSectionId, context?.snapshot),
    onSettled: (_data, _error, { templateSectionId }) => invalidateWhenIdle(templateSectionId),
  })

  return { setAccess, clearAccess }
}
