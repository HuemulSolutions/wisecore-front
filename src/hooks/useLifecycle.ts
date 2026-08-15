import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, useMutationState } from '@tanstack/react-query'
import type { QueryClient, QueryKey } from '@tanstack/react-query'
import {
  getLifecycleStepTypes,
  getLifecycleSteps,
  updateLifecycleStep,
  addRoleToStep,
  removeRoleFromStep,
  getSlaUnits,
  createLifecycleStep,
  deleteLifecycleStep,
  getDocumentStepGrants,
  grantLifecycleDocument,
  revokeLifecycleDocument,
  getExternalPublishActions,
  createExternalPublishAction,
  updateExternalPublishAction,
  deleteExternalPublishAction,
  reorderExternalPublishActions,
  getExternalReviewActions,
  createExternalReviewAction,
  updateExternalReviewAction,
  deleteExternalReviewAction,
  reorderExternalReviewActions,
  getAccessRuleTypes,
  addAccessRuleToStep,
  removeAccessRuleFromStep,
  type LifecycleStep,
  type LifecycleStepsResponse,
  type UpdateLifecycleStepData,
  type CreateLifecycleStepData,
  type GrantLifecycleDocumentRequest,
  type GrantLifecycleDocumentResponse,
  type RevokeLifecycleDocumentRequest,
  type RevokeLifecycleDocumentResponse,
  type CreateExternalPublishActionRequest,
  type UpdateExternalPublishActionRequest,
  type ReorderExternalPublishActionsRequest,
  type CreateExternalReviewActionRequest,
  type UpdateExternalReviewActionRequest,
  type ReorderExternalReviewActionsRequest,
  type CreateAccessRuleData,
} from '@/services/lifecycle'
import { usesRoleList } from '@/lib/lifecycle-access'

export const lifecycleQueryKeys = {
  all: ['lifecycle'] as const,
  stepTypes: () => [...lifecycleQueryKeys.all, 'step-types'] as const,
  accessRuleTypes: () => [...lifecycleQueryKeys.all, 'access-rule-types'] as const,
  steps: (documentTypeId: string, stepType: string | null) =>
    [...lifecycleQueryKeys.all, 'steps', documentTypeId, stepType] as const,
  // Prefijo compartido por `steps(documentTypeId, stepType)` y `steps(documentTypeId, null)` —
  // invalidar por este prefijo refresca tanto el step activo como la matriz de "todos los steps".
  stepsByDocumentType: (documentTypeId: string) =>
    [...lifecycleQueryKeys.all, 'steps', documentTypeId] as const,
  slaUnits: () => [...lifecycleQueryKeys.all, 'sla-units'] as const,
  documentStepGrants: (organizationId: string, documentId: string, stepId: string) =>
    [...lifecycleQueryKeys.all, 'document-step-grants', organizationId, documentId, stepId] as const,
  externalPublishActionsBase: () => [...lifecycleQueryKeys.all, 'external-publish-actions'] as const,
  externalPublishActions: (stepId: string) =>
    [...lifecycleQueryKeys.externalPublishActionsBase(), stepId] as const,
  externalReviewActionsBase: () => [...lifecycleQueryKeys.all, 'external-review-actions'] as const,
  externalReviewActions: (stepId: string) =>
    [...lifecycleQueryKeys.externalReviewActionsBase(), stepId] as const,
}

export function useLifecycleStepTypes(enabled: boolean = true) {
  return useQuery({
    queryKey: lifecycleQueryKeys.stepTypes(),
    queryFn: getLifecycleStepTypes,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

export function useLifecycleAccessRuleTypes(enabled: boolean = true) {
  return useQuery({
    queryKey: lifecycleQueryKeys.accessRuleTypes(),
    queryFn: getAccessRuleTypes,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

export function useLifecycleSteps(
  documentTypeId: string | null,
  stepType: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: lifecycleQueryKeys.steps(documentTypeId ?? '', stepType),
    queryFn: () => getLifecycleSteps(documentTypeId!, stepType ?? undefined),
    enabled: enabled && !!documentTypeId && !!stepType,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

// All steps of a document type, regardless of step type — used to build the
// "earlier step" candidate list for the step_actor_manager access rule.
export function useAllLifecycleSteps(documentTypeId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: lifecycleQueryKeys.steps(documentTypeId ?? '', null),
    queryFn: () => getLifecycleSteps(documentTypeId!),
    enabled: enabled && !!documentTypeId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

export function useLifecycleSlaUnits(enabled: boolean = true) {
  return useQuery({
    queryKey: lifecycleQueryKeys.slaUnits(),
    queryFn: getSlaUnits,
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 0,
  })
}

// ─── Mutaciones de steps: clave común, optimismo y pendientes por step ──────
//
// Todas las mutaciones de steps de un document type comparten `mutationKey`.
// Eso habilita dos cosas que antes no existían en el módulo:
//   1. `usePendingLifecycleStepIds` — saber QUÉ step está en vuelo (antes la
//      matriz miraba `updateStep.isPending`, que congelaba todas las celdas
//      por un solo clic).
//   2. Invalidar una sola vez al final de una ráfaga: si cada mutación
//      invalidara, un refetch a mitad del batch del panel traería datos a
//      medio camino y pisaría el estado optimista de las que siguen en vuelo.
export const lifecycleStepMutationKey = (documentTypeId: string) =>
  ['lifecycle', 'step-mutation', documentTypeId] as const

/** Snapshot de todas las queries de steps del document type, para el rollback. */
type LifecycleStepsSnapshot = Array<[QueryKey, LifecycleStepsResponse | undefined]>

/** `variables` es `{ stepId }` en todas las mutaciones salvo `deleteStep`, que recibe el id crudo. */
function stepIdFromMutationVariables(variables: unknown): string | null {
  if (typeof variables === 'string') return variables
  if (variables && typeof variables === 'object' && 'stepId' in variables) {
    const stepId = (variables as { stepId?: unknown }).stepId
    return typeof stepId === 'string' ? stepId : null
  }
  return null
}

/**
 * Ids de steps con una mutación en vuelo, leídos de la mutation cache y no del
 * `isPending` de una instancia: la matriz ve también lo que dispara el panel
 * lateral, aunque sean componentes distintos.
 */
export function usePendingLifecycleStepIds(documentTypeId: string): ReadonlySet<string> {
  const pendingStepIds = useMutationState({
    filters: { mutationKey: lifecycleStepMutationKey(documentTypeId), status: 'pending' },
    select: (mutation) => stepIdFromMutationVariables(mutation.state.variables),
  })
  // `useMutationState` pasa el resultado por `replaceEqualDeep`: la identidad del
  // array solo cambia con el contenido, así que el memo no se recalcula en cada
  // notificación de la mutation cache.
  return useMemo(
    () => new Set(pendingStepIds.filter((id): id is string => id !== null)),
    [pendingStepIds],
  )
}

/**
 * Traduce un `UpdateLifecycleStepData` (PATCH parcial) a un parche sobre el
 * `LifecycleStep` cacheado. Solo toca las claves presentes en el body: las
 * ausentes las conserva el backend, así que el optimista debe conservarlas también.
 */
function optimisticStepPatch(data: UpdateLifecycleStepData) {
  return (step: LifecycleStep): LifecycleStep => {
    const next: LifecycleStep = { ...step }
    if (data.name !== undefined) next.name = data.name
    if (data.order !== undefined) next.order = data.order
    if (data.mode !== undefined) next.mode = data.mode
    if (data.access_type !== undefined) next.access_type = data.access_type
    if (data.valid_from !== undefined) next.valid_from = data.valid_from
    if (data.valid_to !== undefined) next.valid_to = data.valid_to
    if (data.sla_value !== undefined) next.sla_value = data.sla_value
    if (data.sla_unit !== undefined) next.sla_unit = data.sla_unit
    if (data.role_ids !== undefined) {
      // `role_ids` es reemplazo total. Se conservan los `role_name` ya conocidos
      // para no perder la etiqueta de los chips; los nuevos quedan sin nombre
      // hasta el refetch.
      const roleNameById = new Map(step.step_roles.map((r) => [r.role_id, r.role_name]))
      next.step_roles = data.role_ids.map((role_id) => ({
        role_id,
        role_name: roleNameById.get(role_id),
      }))
    } else if (data.access_type !== undefined && !usesRoleList(data.access_type)) {
      // El body no puede llevar `role_ids` fuera de `custom`/`custom_owner` —el
      // backend responde 422 incluso con `[]`—, así que la limpieza la hace el
      // optimista: salir del acceso por roles apaga los checks en el mismo frame.
      next.step_roles = []
    }
    if (data.access_rules !== undefined) {
      // El id real lo asigna el backend; el optimista usa uno sintético que el
      // refetch de `onSettled` reemplaza.
      next.access_rules = data.access_rules.map((rule, index) => ({
        id: `optimistic-${step.id}-${index}`,
        rule_type: rule.rule_type,
        source_step_id: rule.source_step_id ?? null,
      }))
    }
    return next
  }
}

/**
 * Aplica `patch` a un step en TODAS las queries de steps del document type
 * —la del step type activo y la de `useAllLifecycleSteps` (key con `null`)—
 * y devuelve el snapshot previo para el rollback de `onError`.
 */
async function applyOptimisticStepPatch(
  queryClient: QueryClient,
  documentTypeId: string,
  stepId: string,
  patch: (step: LifecycleStep) => LifecycleStep,
): Promise<LifecycleStepsSnapshot> {
  const queryKey = lifecycleQueryKeys.stepsByDocumentType(documentTypeId)
  // Un GET en vuelo resolvería después del parche y lo pisaría con datos viejos.
  await queryClient.cancelQueries({ queryKey })
  const snapshot = queryClient.getQueriesData<LifecycleStepsResponse>({ queryKey })
  queryClient.setQueriesData<LifecycleStepsResponse>({ queryKey }, (previous) => {
    if (!previous?.data?.steps) return previous
    let changed = false
    const steps = previous.data.steps.map((step) => {
      if (step.id !== stepId) return step
      changed = true
      return patch(step)
    })
    return changed ? { ...previous, data: { ...previous.data, steps } } : previous
  })
  return snapshot
}

function restoreStepsSnapshot(
  queryClient: QueryClient,
  snapshot: LifecycleStepsSnapshot | undefined,
) {
  snapshot?.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
}

// `stepType` ya no participa en la invalidación (ver `invalidateSteps`, que ahora
// invalida por el prefijo `documentTypeId` completo), pero se mantiene en la firma
// para no tocar los ~5 call sites existentes que lo pasan.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useLifecycleMutations(documentTypeId: string, _stepType: string | null) {
  const queryClient = useQueryClient()
  const mutationKey = lifecycleStepMutationKey(documentTypeId)

  const invalidateSteps = () => {
    // Invalida por el prefijo compartido: refresca tanto la query del step type
    // activo como `useAllLifecycleSteps` (key con stepType `null`), que alimenta
    // la matriz de permisos por rol.
    return queryClient.invalidateQueries({
      queryKey: lifecycleQueryKeys.stepsByDocumentType(documentTypeId),
    })
  }

  // Solo la última mutación en vuelo refetchea. Dentro de `onSettled` la propia
  // mutación sigue contando como pending (query-core despacha 'success'/'error'
  // DESPUÉS de los callbacks), así que `=== 1` significa «soy la última».
  // Sin este guard, el batch del panel dispararía N refetch y cada uno pisaría
  // el optimismo de las mutaciones que siguen abiertas.
  const invalidateStepsWhenIdle = () => {
    if (queryClient.isMutating({ mutationKey }) === 1) return invalidateSteps()
  }

  const updateStep = useMutation({
    mutationKey,
    mutationFn: ({ stepId, data }: { stepId: string; data: UpdateLifecycleStepData }) =>
      updateLifecycleStep(stepId, data),
    // Repinta la matriz en el mismo frame del clic: el round-trip ya no se ve.
    onMutate: ({ stepId, data }) =>
      applyOptimisticStepPatch(queryClient, documentTypeId, stepId, optimisticStepPatch(data)),
    // Rollback de grano grueso: si dos `updateStep` corren en paralelo (p. ej.
    // `confirmRemoveRole` de la matriz, que dispara uno por step con el rol) y
    // uno falla, su snapshot puede revertir visualmente el parche de una
    // hermana ya aplicada. La invalidación final de `onSettled` reconcilia —el
    // estado convergente es correcto, solo hay parpadeo en el fallo parcial.
    onError: (_error, _variables, snapshot) => restoreStepsSnapshot(queryClient, snapshot),
    onSettled: invalidateStepsWhenIdle,
  })

  const addRole = useMutation({
    mutationKey,
    mutationFn: ({ stepId, roleId }: { stepId: string; roleId: string }) =>
      addRoleToStep(stepId, roleId),
    onSettled: invalidateStepsWhenIdle,
  })

  const removeRole = useMutation({
    mutationKey,
    mutationFn: ({ stepId, roleId }: { stepId: string; roleId: string }) =>
      removeRoleFromStep(stepId, roleId),
    onSettled: invalidateStepsWhenIdle,
  })

  const createStep = useMutation({
    mutationKey,
    mutationFn: (data: CreateLifecycleStepData) =>
      createLifecycleStep(documentTypeId, data),
    onSettled: invalidateStepsWhenIdle,
  })

  const deleteStep = useMutation({
    mutationKey,
    mutationFn: (stepId: string) => deleteLifecycleStep(stepId),
    onSettled: invalidateStepsWhenIdle,
  })

  const addAccessRule = useMutation({
    mutationKey,
    mutationFn: ({ stepId, data }: { stepId: string; data: CreateAccessRuleData }) =>
      addAccessRuleToStep(stepId, data),
    onSettled: invalidateStepsWhenIdle,
  })

  const removeAccessRule = useMutation({
    mutationKey,
    mutationFn: ({ stepId, ruleId }: { stepId: string; ruleId: string }) =>
      removeAccessRuleFromStep(stepId, ruleId),
    onSettled: invalidateStepsWhenIdle,
  })

  return { updateStep, addRole, removeRole, createStep, deleteStep, addAccessRule, removeAccessRule }
}

// ─── Document grants ────────────────────────────────────────────────────────

export function useDocumentStepGrants(
  organizationId: string,
  documentId: string,
  stepId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: lifecycleQueryKeys.documentStepGrants(organizationId, documentId, stepId),
    queryFn: () => getDocumentStepGrants(organizationId, documentId, stepId),
    enabled: enabled && !!organizationId && !!documentId && !!stepId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

export function useDocumentGrantMutations(organizationId: string, documentId: string) {
  const queryClient = useQueryClient()

  const grant = useMutation({
    mutationFn: (body: GrantLifecycleDocumentRequest) =>
      grantLifecycleDocument(organizationId, documentId, body),
    onSuccess: (_data: GrantLifecycleDocumentResponse, { lifecycle_step_id }) => {
      queryClient.invalidateQueries({
        queryKey: lifecycleQueryKeys.documentStepGrants(organizationId, documentId, lifecycle_step_id),
      })
    },
  })

  const revoke = useMutation({
    mutationFn: (body: RevokeLifecycleDocumentRequest) =>
      revokeLifecycleDocument(organizationId, documentId, body),
    onSuccess: (_data: RevokeLifecycleDocumentResponse, { lifecycle_step_id }) => {
      queryClient.invalidateQueries({
        queryKey: lifecycleQueryKeys.documentStepGrants(organizationId, documentId, lifecycle_step_id),
      })
    },
  })

  return { grant, revoke }
}

// ─── External Publish Actions ─────────────────────────────────────────────────

export function useExternalPublishActions(
  organizationId: string,
  stepId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: lifecycleQueryKeys.externalPublishActions(stepId),
    queryFn: () => getExternalPublishActions(stepId, organizationId),
    enabled: enabled && !!organizationId && !!stepId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

export function useExternalPublishActionMutations(organizationId: string, stepId: string) {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: lifecycleQueryKeys.externalPublishActions(stepId),
    })

  const createAction = useMutation({
    mutationFn: (body: CreateExternalPublishActionRequest) =>
      createExternalPublishAction(stepId, organizationId, body),
    onSuccess: invalidate,
  })

  const updateAction = useMutation({
    mutationFn: ({ actionId, body }: { actionId: string; body: UpdateExternalPublishActionRequest }) =>
      updateExternalPublishAction(stepId, actionId, organizationId, body),
    onSuccess: invalidate,
  })

  const deleteAction = useMutation({
    mutationFn: (actionId: string) => deleteExternalPublishAction(stepId, actionId, organizationId),
    onSuccess: invalidate,
  })

  const reorderActions = useMutation({
    mutationFn: (body: ReorderExternalPublishActionsRequest) =>
      reorderExternalPublishActions(stepId, organizationId, body),
    onSuccess: invalidate,
  })

  return { createAction, updateAction, deleteAction, reorderActions }
}

// ─── External Review Actions ─────────────────────────────────────────────────

export function useExternalReviewActions(
  organizationId: string,
  stepId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: lifecycleQueryKeys.externalReviewActions(stepId),
    queryFn: () => getExternalReviewActions(stepId, organizationId),
    enabled: enabled && !!organizationId && !!stepId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

export function useExternalReviewActionMutations(organizationId: string, stepId: string) {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: lifecycleQueryKeys.externalReviewActions(stepId),
    })

  const createAction = useMutation({
    mutationFn: (body: CreateExternalReviewActionRequest) =>
      createExternalReviewAction(stepId, organizationId, body),
    onSuccess: invalidate,
  })

  const updateAction = useMutation({
    mutationFn: ({ actionId, body }: { actionId: string; body: UpdateExternalReviewActionRequest }) =>
      updateExternalReviewAction(stepId, actionId, organizationId, body),
    onSuccess: invalidate,
  })

  const deleteAction = useMutation({
    mutationFn: (actionId: string) => deleteExternalReviewAction(stepId, actionId, organizationId),
    onSuccess: invalidate,
  })

  const reorderActions = useMutation({
    mutationFn: (body: ReorderExternalReviewActionsRequest) =>
      reorderExternalReviewActions(stepId, organizationId, body),
    onSuccess: invalidate,
  })

  return { createAction, updateAction, deleteAction, reorderActions }
}
