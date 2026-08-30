import { useCallback, useMemo } from 'react'
import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import {
  clearTemplateSectionLifecycleAccess,
  getTemplateLifecycleAccessMatrix,
  setTemplateSectionLifecycleAccess,
} from '@/services/template-section-lifecycle-access'
import { isPermissionStepType, pipelineSortIndex } from '@/lib/lifecycle-access'
import type {
  InheritedViewAccess,
  TemplateLifecycleAccessMatrix,
  TemplateSectionAccess,
} from '@/types/templates/section-lifecycle-access'

export const templateSectionAccessQueryKeys = {
  all: ['template-section-lifecycle-access'] as const,
  matrix: (organizationId: string, templateId: string) =>
    [...templateSectionAccessQueryKeys.all, 'matrix', organizationId, templateId] as const,
}

/** Fila derivada: una sección de la plantilla. */
export interface MatrixSection {
  id: string
  name: string
  order: number
}

/** Fila derivada: un step del ciclo de vida del tipo de activo actual. */
export interface MatrixStep {
  id: string
  document_type_id: string
  type: string
  name: string
  order: number
}

/**
 * Mapa `stepId -> access` de una sección. Un step ausente del mapa HEREDA el
 * permiso del documento en esa etapa — el backend no persiste ese caso (ver
 * types/templates/section-lifecycle-access).
 */
export type SectionAccessByStep = ReadonlyMap<string, TemplateSectionAccess>

/** Mapa `stepId -> (roleId -> access)` de una sección: los niveles propios por rol. */
export type SectionRoleAccessByStep = ReadonlyMap<string, ReadonlyMap<string, TemplateSectionAccess>>

/**
 * Solo las filas globales (sin `role_id`) cuentan para el acceso por defecto de
 * la sección — una fila por rol no debe pintarse como si aplicara a todos.
 */
function toAccessBySection(access: TemplateLifecycleAccessMatrix['access']): Map<string, SectionAccessByStep> {
  const map = new Map<string, Map<string, TemplateSectionAccess>>()
  for (const row of access) {
    if (row.role_id) continue
    const bySection = map.get(row.template_section_id) ?? new Map<string, TemplateSectionAccess>()
    bySection.set(row.lifecycle_step_id, row.access)
    map.set(row.template_section_id, bySection)
  }
  return map
}

/** Solo las filas por rol (con `role_id`) — los niveles propios que overridean la fila global. */
function toRoleAccessBySection(
  access: TemplateLifecycleAccessMatrix['access'],
): Map<string, Map<string, Map<string, TemplateSectionAccess>>> {
  const map = new Map<string, Map<string, Map<string, TemplateSectionAccess>>>()
  for (const row of access) {
    if (!row.role_id) continue
    const bySection = map.get(row.template_section_id) ?? new Map<string, Map<string, TemplateSectionAccess>>()
    const byStep = bySection.get(row.lifecycle_step_id) ?? new Map<string, TemplateSectionAccess>()
    byStep.set(row.role_id, row.access)
    bySection.set(row.lifecycle_step_id, byStep)
    map.set(row.template_section_id, bySection)
  }
  return map
}

/** Sentinel de `roleId` para la fila global dentro de `SectionInheritedViewByRole`. */
export const INHERITED_VIEW_GLOBAL_KEY = '__global__'

/** Mapa `(roleId | INHERITED_VIEW_GLOBAL_KEY) -> InheritedViewAccess` de una sección. */
export type SectionInheritedViewByRole = ReadonlyMap<string, InheritedViewAccess>

/**
 * `inherited_view_access` es CALCULADO por el backend (ver el comentario del
 * tipo): no tiene `lifecycle_step_id` propio porque solo aplica al step `view`
 * de la plantilla — por eso el mapa es solo `sectionId -> (roleId -> entrada)`,
 * sin la dimensión de step que sí tiene `accessBySection`/`roleAccessBySection`.
 */
function toInheritedViewBySection(
  inheritedViewAccess: InheritedViewAccess[],
): Map<string, SectionInheritedViewByRole> {
  const map = new Map<string, Map<string, InheritedViewAccess>>()
  for (const row of inheritedViewAccess) {
    const byRole = map.get(row.template_section_id) ?? new Map<string, InheritedViewAccess>()
    byRole.set(row.role_id ?? INHERITED_VIEW_GLOBAL_KEY, row)
    map.set(row.template_section_id, byRole)
  }
  return map
}

/**
 * Matriz sección × step de una plantilla, en el contexto de un tipo de activo
 * puntual: una sola query (`lifecycle_access_matrix`) en vez de un GET por
 * sección. El endpoint devuelve los steps de TODOS los tipos de activo
 * vinculados al template, así que se filtran por `documentTypeId` acá.
 */
export function useTemplateLifecycleAccessMatrix(
  organizationId: string,
  templateId: string,
  documentTypeId: string,
  enabled: boolean = true,
) {
  const queryClient = useQueryClient()
  const queryKey = templateSectionAccessQueryKeys.matrix(organizationId, templateId)

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => getTemplateLifecycleAccessMatrix(organizationId, templateId),
    enabled: enabled && !!organizationId && !!templateId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })

  const sections = useMemo<MatrixSection[]>(
    () => [...(data?.sections ?? [])].sort((a, b) => a.order - b.order),
    [data],
  )

  const steps = useMemo<MatrixStep[]>(() => {
    // `isPermissionStepType` descarta create/publish/archive: el backend ya no
    // los manda, pero se filtran también acá por si quedan en caché vieja.
    const ownSteps = (data?.lifecycle_steps ?? []).filter(
      (step) => step.document_type_id === documentTypeId && isPermissionStepType(step.type),
    )
    return [...ownSteps].sort((a, b) => {
      const typeDiff = pipelineSortIndex(a.type) - pipelineSortIndex(b.type)
      if (typeDiff !== 0) return typeDiff
      return a.order - b.order
    })
  }, [data, documentTypeId])

  const accessBySection = useMemo(() => toAccessBySection(data?.access ?? []), [data])
  const roleAccessBySection = useMemo(() => toRoleAccessBySection(data?.access ?? []), [data])
  const inheritedViewBySection = useMemo(
    () => toInheritedViewBySection(data?.inherited_view_access ?? []),
    [data],
  )

  /** Step `view` de este tipo de activo — única columna a la que aplica la herencia. */
  const viewStepId = useMemo(() => steps.find((step) => step.type === 'view')?.id ?? null, [steps])

  const refetchAll = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey],
  )

  return {
    sections,
    steps,
    accessBySection,
    roleAccessBySection,
    inheritedViewBySection,
    viewStepId,
    isLoading,
    isFetching,
    refetch,
    refetchAll,
  }
}

// ─── Mutaciones: clave común, optimismo y pendientes por celda ──────────────
//
// Mismo esquema que las mutaciones de steps (`useLifecycle.ts`): una mutationKey
// compartida habilita saber QUÉ celda está en vuelo (sin congelar la tabla entera)
// e invalidar una sola vez al final de una ráfaga de clics.
export const templateSectionAccessMutationKey = (organizationId: string) =>
  ['template-section-lifecycle-access', 'mutation', organizationId] as const

type AccessMutationVariables = {
  templateSectionId: string
  lifecycleStepId: string
  /** Ausente = fila global. Con valor, la escritura queda acotada a ese rol del step. */
  roleId?: string | null
}

/**
 * Clave de celda usada por el componente para pintar el spinner. Sin `roleId`
 * identifica la celda entera (fila global); con `roleId` identifica la sub-fila
 * de ese rol dentro del popover.
 */
export const sectionAccessCellKey = (
  templateSectionId: string,
  lifecycleStepId: string,
  roleId?: string | null,
) => (roleId ? `${templateSectionId}:${lifecycleStepId}:${roleId}` : `${templateSectionId}:${lifecycleStepId}`)

function cellKeyFromVariables(variables: unknown): string | null {
  if (!variables || typeof variables !== 'object') return null
  const { templateSectionId, lifecycleStepId, roleId } = variables as Partial<AccessMutationVariables>
  if (typeof templateSectionId !== 'string' || typeof lifecycleStepId !== 'string') return null
  return sectionAccessCellKey(templateSectionId, lifecycleStepId, roleId)
}

/** Celdas (y sub-filas por rol) con una escritura en vuelo, leídas de la mutation cache. */
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

type MatrixSnapshot = TemplateLifecycleAccessMatrix | undefined

/**
 * Aplica el cambio sobre la cache de la matriz completa y devuelve el snapshot
 * previo para el rollback de `onError`. `access === null` significa «volver a
 * heredar del documento» (sin `roleId`) o «volver a seguir el nivel global»
 * (con `roleId`).
 */
async function applyOptimisticAccess(
  queryClient: QueryClient,
  organizationId: string,
  templateId: string,
  templateSectionId: string,
  lifecycleStepId: string,
  roleId: string | null,
  access: TemplateSectionAccess | null,
): Promise<MatrixSnapshot> {
  const queryKey = templateSectionAccessQueryKeys.matrix(organizationId, templateId)
  // Un GET en vuelo resolvería después del parche y lo pisaría con datos viejos.
  await queryClient.cancelQueries({ queryKey })
  const snapshot = queryClient.getQueryData<TemplateLifecycleAccessMatrix>(queryKey)
  queryClient.setQueryData<TemplateLifecycleAccessMatrix>(queryKey, (previous) => {
    if (!previous) return previous
    // Solo se toca la fila del `roleId` pedido (global cuando es `null`) — el
    // resto de las filas del mismo par (sección, step) queda intacto.
    const matchesTarget = (row: TemplateLifecycleAccessMatrix['access'][number]) =>
      row.template_section_id === templateSectionId &&
      row.lifecycle_step_id === lifecycleStepId &&
      (row.role_id ?? null) === roleId
    const without = previous.access.filter((row) => !matchesTarget(row))
    if (access === null) return { ...previous, access: without }
    const existing = previous.access.find(matchesTarget)
    return {
      ...previous,
      access: [
        ...without,
        {
          // El id real lo asigna el backend; el refetch de `onSettled` lo reemplaza.
          id: existing?.id ?? `optimistic-${templateSectionId}-${lifecycleStepId}-${roleId ?? 'global'}`,
          template_section_id: templateSectionId,
          lifecycle_step_id: lifecycleStepId,
          role_id: roleId,
          access,
        },
      ],
    }
  })
  return snapshot
}

export function useTemplateSectionAccessMutations(organizationId: string, templateId: string) {
  const queryClient = useQueryClient()
  const mutationKey = templateSectionAccessMutationKey(organizationId)
  const queryKey = templateSectionAccessQueryKeys.matrix(organizationId, templateId)

  const restore = (snapshot: MatrixSnapshot) => {
    queryClient.setQueryData(queryKey, snapshot)
  }

  // Solo la última mutación en vuelo refetchea: dentro de `onSettled` la propia
  // mutación sigue contando como pending, así que `=== 1` significa «soy la última».
  const invalidateWhenIdle = () => {
    if (queryClient.isMutating({ mutationKey }) !== 1) return
    return queryClient.invalidateQueries({ queryKey })
  }

  const setAccess = useMutation({
    mutationKey,
    mutationFn: ({
      templateSectionId,
      lifecycleStepId,
      roleId,
      access,
    }: AccessMutationVariables & { access: TemplateSectionAccess }) =>
      setTemplateSectionLifecycleAccess(organizationId, templateSectionId, lifecycleStepId, {
        access,
        ...(roleId ? { role_id: roleId } : {}),
      }),
    onMutate: ({ templateSectionId, lifecycleStepId, roleId, access }) =>
      applyOptimisticAccess(
        queryClient,
        organizationId,
        templateId,
        templateSectionId,
        lifecycleStepId,
        roleId ?? null,
        access,
      ).then((snapshot) => ({ snapshot })),
    onError: (_error, _variables, context) => restore(context?.snapshot),
    onSettled: () => invalidateWhenIdle(),
  })

  const clearAccess = useMutation({
    mutationKey,
    mutationFn: ({ templateSectionId, lifecycleStepId, roleId }: AccessMutationVariables) =>
      clearTemplateSectionLifecycleAccess(organizationId, templateSectionId, lifecycleStepId, roleId),
    onMutate: ({ templateSectionId, lifecycleStepId, roleId }) =>
      applyOptimisticAccess(
        queryClient,
        organizationId,
        templateId,
        templateSectionId,
        lifecycleStepId,
        roleId ?? null,
        null,
      ).then((snapshot) => ({ snapshot })),
    onError: (_error, _variables, context) => restore(context?.snapshot),
    onSettled: () => invalidateWhenIdle(),
  })

  return { setAccess, clearAccess }
}
