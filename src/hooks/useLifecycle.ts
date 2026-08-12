import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

// `stepType` ya no participa en la invalidación (ver `invalidateSteps`, que ahora
// invalida por el prefijo `documentTypeId` completo), pero se mantiene en la firma
// para no tocar los ~5 call sites existentes que lo pasan.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useLifecycleMutations(documentTypeId: string, _stepType: string | null) {
  const queryClient = useQueryClient()

  const invalidateSteps = () => {
    // Invalida por el prefijo compartido: refresca tanto la query del step type
    // activo como `useAllLifecycleSteps` (key con stepType `null`), que alimenta
    // la matriz de permisos por rol.
    queryClient.invalidateQueries({
      queryKey: lifecycleQueryKeys.stepsByDocumentType(documentTypeId),
    })
  }

  const updateStep = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: UpdateLifecycleStepData }) =>
      updateLifecycleStep(stepId, data),
    onSuccess: invalidateSteps,
  })

  const addRole = useMutation({
    mutationFn: ({ stepId, roleId }: { stepId: string; roleId: string }) =>
      addRoleToStep(stepId, roleId),
    onSuccess: invalidateSteps,
  })

  const removeRole = useMutation({
    mutationFn: ({ stepId, roleId }: { stepId: string; roleId: string }) =>
      removeRoleFromStep(stepId, roleId),
    onSuccess: invalidateSteps,
  })

  const createStep = useMutation({
    mutationFn: (data: CreateLifecycleStepData) =>
      createLifecycleStep(documentTypeId, data),
    onSuccess: invalidateSteps,
  })

  const deleteStep = useMutation({
    mutationFn: (stepId: string) => deleteLifecycleStep(stepId),
    onSuccess: invalidateSteps,
  })

  const addAccessRule = useMutation({
    mutationFn: ({ stepId, data }: { stepId: string; data: CreateAccessRuleData }) =>
      addAccessRuleToStep(stepId, data),
    onSuccess: invalidateSteps,
  })

  const removeAccessRule = useMutation({
    mutationFn: ({ stepId, ruleId }: { stepId: string; ruleId: string }) =>
      removeAccessRuleFromStep(stepId, ruleId),
    onSuccess: invalidateSteps,
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
